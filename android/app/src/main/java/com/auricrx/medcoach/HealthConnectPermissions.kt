package com.auricrx.medcoach

import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import com.facebook.react.bridge.Promise
import org.json.JSONArray

object HealthConnectPermissions {
    val reads = linkedMapOf(
        HealthPermission.getReadPermission(HeartRateRecord::class) to "HeartRate",
        HealthPermission.getReadPermission(RestingHeartRateRecord::class) to "RestingHeartRate",
        HealthPermission.getReadPermission(StepsRecord::class) to "Steps",
        HealthPermission.getReadPermission(ExerciseSessionRecord::class) to "ExerciseSession"
    )
    private var launcher: ActivityResultLauncher<Set<String>>? = null
    private var pending: Promise? = null
    fun register(activity: ComponentActivity) {
        launcher = activity.registerForActivityResult(PermissionController.createRequestPermissionResultContract()) { granted ->
            pending?.resolve(JSONArray(reads.filterKeys { it in granted }.values.toList()).toString())
            pending = null
        }
    }
    fun request(promise: Promise) {
        val current = launcher
        if (current == null || pending != null) { promise.reject("HC_BUSY", "Permission screen unavailable"); return }
        pending = promise
        try { current.launch(reads.keys) }
        catch (error: Exception) { pending = null; promise.reject("HC_PERMISSION", "Permission request failed") }
    }
}
