package com.auricrx.medcoach

import android.content.Intent
import android.os.Build
import android.content.pm.PackageManager
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.*
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.time.*
import java.time.temporal.TemporalAdjusters

// PHONE ONLY / LOCAL ONLY: never send these records to servers, OpenAI,
// analytics, crash logs, or the Alfred/Mimi/Pawlmer chat context.
class HealthConnectModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val client get() = HealthConnectClient.getOrCreate(context)
    override fun getName() = "AuricHealthConnect"
    override fun invalidate() { scope.cancel(); super.invalidate() }
    private fun run(promise: Promise, block: suspend () -> String) {
        scope.launch {
            try { promise.resolve(block()) }
            catch (error: SecurityException) { promise.reject("HC_DENIED", "Health Connect permission denied") }
            catch (error: Exception) { promise.reject("HC_UNAVAILABLE", "Health Connect operation unavailable") }
        }
    }
    @ReactMethod fun getStatus(promise: Promise) {
        try {
            val result = HealthConnectClient.getSdkStatus(context)
            promise.resolve(when (result) {
                HealthConnectClient.SDK_AVAILABLE -> "available"
                HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "install"
                else -> "unavailable"
            })
        } catch (error: Exception) { promise.resolve("unavailable") }
    }
    @ReactMethod fun getPermissions(promise: Promise) = run(promise) {
        val granted = client.permissionController.getGrantedPermissions()
        JSONArray(HealthConnectPermissions.reads.filterKeys { it in granted }.values.toList()).toString()
    }
    @ReactMethod fun requestPermissions(promise: Promise) {
        scope.launch { HealthConnectPermissions.request(promise) }
    }
    @ReactMethod fun revokePermissions(promise: Promise) = run(promise) {
        client.permissionController.revokeAllPermissions(); "true"
    }
    @ReactMethod fun openSettings(promise: Promise) {
        try {
            val action = if (Build.VERSION.SDK_INT >= 34) "android.health.connect.action.HEALTH_HOME_SETTINGS" else "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS"
            context.startActivity(Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            promise.resolve(true)
        } catch (error: Exception) {
            try {
                context.startActivity(Intent("androidx.health.ACTION_HEALTH_CONNECT_SETTINGS").setPackage("com.google.android.apps.healthdata").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                promise.resolve(true)
            } catch (other: Exception) { promise.reject("HC_SETTINGS", "Health Connect settings unavailable") }
        }
    }
    private suspend inline fun <reified T : Record> records(start: Instant, end: Instant): List<T> {
        val all = mutableListOf<T>()
        var token: String? = null
        do {
            val page = client.readRecords(ReadRecordsRequest(T::class, TimeRangeFilter.between(start, end), pageSize = 1000, pageToken = token))
            all.addAll(page.records)
            token = page.pageToken
        } while (token != null)
        return all
    }
    @ReactMethod fun readSnapshot(promise: Promise) = run(promise) {
        if (!client.permissionController.getGrantedPermissions().containsAll(HealthConnectPermissions.reads.keys)) throw SecurityException()
        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        val monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val now = Instant.now()
        val weekStart = monday.atStartOfDay(zone).toInstant()
        val previousStart = monday.minusWeeks(1).atStartOfDay(zone).toInstant()
        val origins = linkedSetOf<String>()
        val days = JSONArray()
        for (offset in 6 downTo 0) {
            val date = today.minusDays(offset.toLong())
            val end = minOf(date.plusDays(1).atStartOfDay(zone).toInstant(), now)
            // Health Connect aggregation respects source priority and deduplicates steps.
            val total = client.aggregate(AggregateRequest(setOf(StepsRecord.COUNT_TOTAL), TimeRangeFilter.between(date.atStartOfDay(zone).toInstant(), end)))
            origins.addAll(total.dataOrigins.map { it.packageName })
            days.put(JSONObject().put("date", date.toString()).put("steps", total[StepsRecord.COUNT_TOTAL] ?: 0L))
        }
        val resting = records<RestingHeartRateRecord>(previousStart, now)
        val heartStart = today.minusDays(6).atStartOfDay(zone).toInstant()
        val heart = records<HeartRateRecord>(heartStart, now)
        val sessions = records<ExerciseSessionRecord>(weekStart, now).filter { it.startTime >= weekStart }
        origins.addAll((resting.map { it.metadata.dataOrigin.packageName } + heart.map { it.metadata.dataOrigin.packageName } + sessions.map { it.metadata.dataOrigin.packageName }))
        fun average(values: List<RestingHeartRateRecord>): Any = if (values.isEmpty()) JSONObject.NULL else values.map { it.beatsPerMinute }.average()
        val samples = heart.flatMap { it.samples }.filter { it.time >= heartStart && it.time <= now }.distinctBy { it.time to it.beatsPerMinute }.sortedBy { it.time }
        val exercise = JSONArray()
        sessions.distinctBy { it.metadata.id }.forEach {
            val type = when (it.exerciseType) {
                ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> "Caminata"
                ExerciseSessionRecord.EXERCISE_TYPE_RUNNING -> "Carrera"
                ExerciseSessionRecord.EXERCISE_TYPE_BIKING -> "Ciclismo"
                ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL -> "Natación"
                ExerciseSessionRecord.EXERCISE_TYPE_YOGA -> "Yoga"
                else -> "Ejercicio (tipo ${it.exerciseType})"
            }
            exercise.put(JSONObject().put("type", type).put("date", it.startTime.toString()).put("minutes", Duration.between(it.startTime, it.endTime).toMinutes()))
        }
        val sourceNames = origins.filter { it.isNotBlank() }.map { pkg ->
            try { context.packageManager.getApplicationLabel(context.packageManager.getApplicationInfo(pkg, 0)).toString() }
            catch (error: Exception) { pkg }
        }
        JSONObject().put("days", days)
            .put("restingThisWeek", average(resting.filter { it.time >= weekStart }))
            .put("restingLastWeek", average(resting.filter { it.time < weekStart }))
            .put("heart", JSONArray(samples.map { JSONObject().put("time", it.time.toString()).put("bpm", it.beatsPerMinute) }))
            .put("exercises", exercise).put("origins", JSONArray(sourceNames)).put("updatedAt", now.toString()).toString()
    }
}
