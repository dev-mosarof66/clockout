package expo.modules.clockoutengine

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

// Restarts the guard after a reboot — but only if the user had monitoring on and
// a config exists. BOOT_COMPLETED is an allowed exemption for starting a
// foreground service from the background (Android 12+ FGS-start rules).
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return

    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val wanted = prefs.getBoolean(KEY_MONITORING, false)
    val config = prefs.getString(KEY_CONFIG, null)
    if (!wanted || config == null) return

    try {
      ContextCompat.startForegroundService(context, Intent(context, ClockoutService::class.java))
    } catch (_: Throwable) {
      // Some OEMs block FGS start at boot; the battery-whitelist + autostart
      // guidance in setup is the mitigation. Next app open re-syncs anyway.
    }
  }
}
