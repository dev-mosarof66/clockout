package expo.modules.clockoutengine

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

// Foreground service: polls the foreground app ~1s; when a guarded work app is
// opened outside work hours, shows the nudge overlay. Reads config from prefs.
class ClockoutService : Service() {
  companion object {
    @Volatile
    var isRunning = false

    private const val CHANNEL = "clockout_engine"
    private const val NOTIF_ID = 4201
    private const val POLL_MS = 1000L
    private const val REARM_MS = 30_000L // don't re-nudge same app within 30s
  }

  private val handler = Handler(Looper.getMainLooper())
  private var lastForeground: String? = null
  private var lastNudgeAt = 0L
  private var lastNudgePkg: String? = null
  private val overlay = ClockoutOverlay(this)

  private val poll = object : Runnable {
    override fun run() {
      try {
        tick()
      } catch (_: Throwable) {
        // never let the loop die
      }
      handler.postDelayed(this, POLL_MS)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIF_ID, notification)
    }
    isRunning = true
    handler.removeCallbacks(poll)
    handler.post(poll)
    return START_STICKY
  }

  override fun onDestroy() {
    isRunning = false
    handler.removeCallbacks(poll)
    overlay.dismiss()
    super.onDestroy()
  }

  private fun tick() {
    val config = readConfig() ?: return
    val pkg = currentForegroundPackage() ?: return

    val changed = pkg != lastForeground
    lastForeground = pkg
    if (!changed) return // only act on a fresh app open
    if (pkg == packageName) return // ignore ourselves

    val packages = config.optJSONArray("packages") ?: return
    if (!packages.contains(pkg)) return
    if (isWorkHours(config)) return // only after hours

    val now = System.currentTimeMillis()
    if (pkg == lastNudgePkg && now - lastNudgeAt < REARM_MS) return
    lastNudgeAt = now
    lastNudgePkg = pkg

    val strict = config.optBoolean("strict", false)
    val label = appLabel(pkg)
    overlay.show(label, strict) { action -> recordEvent(label, action) }
  }

  private fun currentForegroundPackage(): String? {
    val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return null
    val end = System.currentTimeMillis()
    val begin = end - 10_000
    val events = usm.queryEvents(begin, end)
    val event = android.app.usage.UsageEvents.Event()
    var pkg: String? = null
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (event.eventType == android.app.usage.UsageEvents.Event.MOVE_TO_FOREGROUND ||
        event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED
      ) {
        pkg = event.packageName
      }
    }
    return pkg
  }

  private fun isWorkHours(config: JSONObject): Boolean {
    val cal = Calendar.getInstance()
    val day = cal.get(Calendar.DAY_OF_WEEK) - 1 // 0=Sun … 6=Sat
    val mins = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val start = config.optInt("start", 540)
    val end = config.optInt("end", 1080)
    val days = config.optJSONArray("days") ?: return false
    var isWorkday = false
    for (i in 0 until days.length()) if (days.optInt(i) == day) isWorkday = true
    return isWorkday && mins >= start && mins < end
  }

  private fun readConfig(): JSONObject? {
    val raw = getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_CONFIG, null) ?: return null
    return try {
      JSONObject(raw)
    } catch (_: Throwable) {
      null
    }
  }

  private fun appLabel(pkg: String): String {
    return try {
      val pm = packageManager
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (_: Throwable) {
      pkg.substringAfterLast('.')
    }
  }

  private fun recordEvent(app: String, action: String) {
    val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val arr = try {
      JSONArray(prefs.getString(KEY_EVENTS, "[]"))
    } catch (_: Throwable) {
      JSONArray()
    }
    arr.put(JSONObject().put("ts", System.currentTimeMillis()).put("app", app).put("action", action))
    prefs.edit().putString(KEY_EVENTS, arr.toString()).apply()
  }

  private fun buildNotification(): Notification {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL, "Clockout protection", NotificationManager.IMPORTANCE_LOW)
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
    return NotificationCompat.Builder(this, CHANNEL)
      .setContentTitle("Clockout is guarding your evenings")
      .setContentText("Watching for work apps after hours")
      .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
      .setOngoing(true)
      .build()
  }
}

private fun JSONArray.contains(value: String): Boolean {
  for (i in 0 until length()) if (optString(i) == value) return true
  return false
}
