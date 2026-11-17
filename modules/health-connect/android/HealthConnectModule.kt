package com.auricrx.medcoach

import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant

class HealthConnectModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.Main)
    private var healthConnectClient: HealthConnectClient? = null

    override fun getName(): String {
        return "HealthConnectModule"
    }

    init {
        try {
            healthConnectClient = HealthConnectClient.getOrCreate(reactContext)
        } catch (e: Exception) {
            Log.e("HealthConnect", "Failed to initialize Health Connect client", e)
        }
    }

    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class)
    )

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        val client = healthConnectClient
        if (client == null) {
            promise.resolve(false)
            return
        }

        scope.launch {
            try {
                val activity = currentActivity
                if (activity == null) {
                    promise.resolve(false)
                    return@launch
                }

                val granted = client.permissionController.getGrantedPermissions()
                if (granted.containsAll(permissions)) {
                    promise.resolve(true)
                } else {
                    val launcher = HealthConnectPermissions.getPermissionLauncher()
                    launcher?.launch(permissions) ?: promise.resolve(false)
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                Log.e("HealthConnect", "Error requesting permissions", e)
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val client = healthConnectClient
        if (client == null) {
            promise.resolve(false)
            return
        }

        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                promise.resolve(granted.containsAll(permissions))
            } catch (e: Exception) {
                Log.e("HealthConnect", "Error checking permissions", e)
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun readSteps(startTime: String, endTime: String, promise: Promise) {
        val client = healthConnectClient
        if (client == null) {
            promise.resolve(null)
            return
        }

        scope.launch {
            try {
                val start = Instant.parse(startTime)
                val end = Instant.parse(endTime)

                val response = client.readRecords(
                    ReadRecordsRequest(
                        StepsRecord::class,
                        TimeRangeFilter.between(start, end)
                    )
                )

                val totalSteps = response.records.sumOf { it.count }
                promise.resolve(totalSteps.toInt())
            } catch (e: Exception) {
                Log.e("HealthConnect", "Error reading steps", e)
                promise.resolve(null)
            }
        }
    }

    @ReactMethod
    fun readSleep(startTime: String, endTime: String, promise: Promise) {
        val client = healthConnectClient
        if (client == null) {
            promise.resolve(null)
            return
        }

        scope.launch {
            try {
                val start = Instant.parse(startTime)
                val end = Instant.parse(endTime)

                val response = client.readRecords(
                    ReadRecordsRequest(
                        SleepSessionRecord::class,
                        TimeRangeFilter.between(start, end)
                    )
                )

                val totalMinutes = response.records.sumOf {
                    val duration = it.endTime.epochSecond - it.startTime.epochSecond
                    duration / 60
                }
                promise.resolve(totalMinutes.toInt())
            } catch (e: Exception) {
                Log.e("HealthConnect", "Error reading sleep", e)
                promise.resolve(null)
            }
        }
    }

    @ReactMethod
    fun readHeartRate(time: String, promise: Promise) {
        val client = healthConnectClient
        if (client == null) {
            promise.resolve(null)
            return
        }

        scope.launch {
            try {
                val instant = Instant.parse(time)
                val start = instant.minusSeconds(3600)
                val end = instant.plusSeconds(3600)

                val response = client.readRecords(
                    ReadRecordsRequest(
                        HeartRateRecord::class,
                        TimeRangeFilter.between(start, end)
                    )
                )

                if (response.records.isNotEmpty()) {
                    val samples = response.records.flatMap { it.samples }
                    if (samples.isNotEmpty()) {
                        val avgHr = samples.map { it.beatsPerMinute }.average()
                        promise.resolve(avgHr.toInt())
                    } else {
                        promise.resolve(null)
                    }
                } else {
                    promise.resolve(null)
                }
            } catch (e: Exception) {
                Log.e("HealthConnect", "Error reading heart rate", e)
                promise.resolve(null)
            }
        }
    }
}
