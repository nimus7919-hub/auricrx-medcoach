package com.auricrx.medcoach

import android.app.Activity
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult

/** RN 0.79 legacy-module interop also exposes this module with newArchEnabled. */
class DocumentScannerPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(AuricDocumentScanner(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class AuricDocumentScanner(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var pending: Promise? = null
  private var launcher: ActivityResultLauncher<IntentSenderRequest>? = null
  override fun getName() = "AuricDocumentScanner"

  private fun finish(images: List<String>? = null, error: Exception? = null) {
    val promise = pending ?: return
    pending = null
    launcher?.unregister()
    launcher = null
    if (error != null) promise.reject("SCANNER_UNAVAILABLE", error)
    else promise.resolve(Arguments.createMap().apply {
      putString("status", if (images == null) "cancel" else "success")
      putArray("scannedImages", Arguments.fromList(images ?: emptyList<String>()))
    })
  }

  @ReactMethod
  fun scanDocument(pageLimit: Int, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      if (pending != null) {
        promise.reject("SCANNER_BUSY", "Scanner already open")
        return@runOnUiThread
      }
      val activity = reactApplicationContext.currentActivity as? ComponentActivity
      if (activity == null) {
        promise.reject("SCANNER_UNAVAILABLE", "No foreground activity")
        return@runOnUiThread
      }
      pending = promise
      try {
        val options = GmsDocumentScannerOptions.Builder()
          .setGalleryImportAllowed(true)
          .setPageLimit(pageLimit.coerceIn(1, 100))
          .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
          .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
          .build()
        // Register without a LifecycleOwner because scanning starts after RESUMED.
        launcher = activity.activityResultRegistry.register(
          "auric-document-scanner", ActivityResultContracts.StartIntentSenderForResult()
        ) { result ->
          try {
            if (result.resultCode == Activity.RESULT_CANCELED) finish()
            else if (result.resultCode == Activity.RESULT_OK) {
              val pages = GmsDocumentScanningResult.fromActivityResultIntent(result.data)?.pages
              if (pages.isNullOrEmpty()) finish(error = IllegalStateException("No scanned pages"))
              else finish(pages.map { it.imageUri.toString() })
            } else finish(error = IllegalStateException("Scanner failed"))
          } catch (error: Exception) { finish(error = error) }
        }
        GmsDocumentScanning.getClient(options).getStartScanIntent(activity)
          .addOnSuccessListener { sender ->
            try { launcher?.launch(IntentSenderRequest.Builder(sender).build()) }
            catch (error: Exception) { finish(error = error) }
          }
          .addOnFailureListener { error -> finish(error = error) }
      } catch (error: Exception) { finish(error = error) }
    }
  }

  override fun invalidate() {
    UiThreadUtil.runOnUiThread { finish(error = IllegalStateException("Scanner disposed")) }
    super.invalidate()
  }
}
