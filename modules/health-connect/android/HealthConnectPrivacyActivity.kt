package com.auricrx.medcoach

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.widget.ScrollView
import android.widget.TextView

/** Always accessible from Health Connect, including before login and without JS. */
class HealthConnectPrivacyActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val content = TextView(this).apply {
            setTextColor(Color.rgb(232, 191, 128))
            textSize = 18f
            setPadding(32, 48, 32, 48)
            text = getString(R.string.hc_privacy_notice)
        }
        setContentView(ScrollView(this).apply {
            setBackgroundColor(Color.rgb(2, 13, 27))
            addView(content)
        })
    }
}
