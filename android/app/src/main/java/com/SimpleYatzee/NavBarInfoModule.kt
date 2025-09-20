package com.SimpleYatzee

import android.provider.Settings
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.*

class NavBarInfoModule(private val reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "NavBarInfo"

  @ReactMethod
  fun getInfo(promise: Promise) {
    try {
      val activity = currentActivity
      val ctx = activity ?: reactApplicationContext

      // 0 = gesture, 1 = 2-button, 2 = 3-button (voi puuttua joillain laitteilla)
      val navMode = try {
        Settings.Secure.getInt(ctx.contentResolver, "navigation_mode", -1)
      } catch (_: Throwable) { -1 }

      // 1) WindowInsets (toimii hyvin gesture + useilla OEMeilla)
      var bottomInsetPx = 0
      if (activity != null) {
        val root: View = activity.window.decorView
        val wi = ViewCompat.getRootWindowInsets(root)
        if (wi != null) {
          val bars = wi.getInsets(
            WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.systemGestures()
          )
          bottomInsetPx = maxOf(0, bars.bottom)
        }
      }

      // 2) Navipalkin dimen (hyvä 3-napin tilassa)
      var navBarHeightPx = 0
      run {
        val id = ctx.resources.getIdentifier("navigation_bar_height", "dimen", "android")
        if (id > 0) navBarHeightPx = ctx.resources.getDimensionPixelSize(id)
      }

      // Paras arvaus: käytä suurinta
      val best = maxOf(bottomInsetPx, navBarHeightPx)

      val map = Arguments.createMap().apply {
        putInt("navigationMode", navMode)
        putInt("bottomInsetPx", bottomInsetPx)
        putInt("navBarHeightPx", navBarHeightPx)
        putInt("bestBottomGutterPx", best)
      }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("E_NAVBARINFO", e)
    }
  }
}
