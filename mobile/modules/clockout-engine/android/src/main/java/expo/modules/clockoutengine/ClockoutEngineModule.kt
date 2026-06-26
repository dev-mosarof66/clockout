package expo.modules.clockoutengine

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val PREFS = "clockout_engine"
const val KEY_CONFIG = "config"
const val KEY_EVENTS = "events"

class ClockoutEngineModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ClockoutEngine")

    Function("hasUsageAccess") {
      val ctx = appContext.reactContext ?: return@Function false
      val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
      } else {
        @Suppress("DEPRECATION")
        appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("hasOverlayPermission") {
      val ctx = appContext.reactContext ?: return@Function false
      Settings.canDrawOverlays(ctx)
    }

    // Store the engine config: {"packages":[...],"start":540,"end":1080,"days":[1,2,3,4,5],"strict":false}
    Function("writeConfig") { configJson: String ->
      val ctx = appContext.reactContext ?: return@Function
      ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        .putString(KEY_CONFIG, configJson)
        .apply()
    }

    // Return recorded nudge outcomes as a JSON array and clear them.
    Function("drainEvents") {
      val ctx = appContext.reactContext ?: return@Function "[]"
      val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val events = prefs.getString(KEY_EVENTS, "[]") ?: "[]"
      prefs.edit().putString(KEY_EVENTS, "[]").apply()
      events
    }

    Function("isRunning") {
      ClockoutService.isRunning
    }

    Function("startMonitoring") {
      val ctx = appContext.reactContext ?: return@Function
      ContextCompat.startForegroundService(ctx, Intent(ctx, ClockoutService::class.java))
    }

    Function("stopMonitoring") {
      val ctx = appContext.reactContext ?: return@Function
      ctx.stopService(Intent(ctx, ClockoutService::class.java))
    }
  }
}
