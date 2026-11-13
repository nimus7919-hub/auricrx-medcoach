package com.auricrx.medcoach

import android.app.Activity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.permission.HealthPermission

object HealthConnectPermissions {
    private var permissionLauncher: ActivityResultLauncher<Set<String>>? = null

    fun register(activity: Activity) {
        if (activity is androidx.activity.ComponentActivity) {
            permissionLauncher = activity.registerForActivityResult(
                ActivityResultContracts.RequestMultiplePermissions()
            ) { permissions ->
            }
        }
    }

    fun getPermissionLauncher(): ActivityResultLauncher<Set<String>>? {
        return permissionLauncher
    }
}
