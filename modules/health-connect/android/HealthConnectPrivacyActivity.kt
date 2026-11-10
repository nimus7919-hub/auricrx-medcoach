package com.auricrx.medcoach

import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.ReactApplicationContext

class HealthConnectPrivacyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val scrollView = ScrollView(this)
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }
        
        val titleView = TextView(this).apply {
            text = "Datos de Health Connect"
            textSize = 24f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }
        
        val bodyView = TextView(this).apply {
            val resId = resources.getIdentifier("hc_privacy_notice", "string", packageName)
            text = if (resId != 0) getString(resId) else "Privacy notice not available"
            textSize = 16f
            setPadding(0, 0, 0, 16)
        }
        
        layout.addView(titleView)
        layout.addView(bodyView)
        scrollView.addView(layout)
        setContentView(scrollView)
    }
}
