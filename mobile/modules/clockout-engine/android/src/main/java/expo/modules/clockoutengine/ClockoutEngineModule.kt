package expo.modules.clockoutengine

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.util.Base64
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.Calendar

const val PREFS = "clockout_engine"
const val KEY_CONFIG = "config"
const val KEY_EVENTS = "events"
// Whether the user wants monitoring on — read by BootReceiver to restart after reboot.
const val KEY_MONITORING = "monitoring"
// Streak / reclaimed totals pushed from JS for the home-screen widget.
const val KEY_WIDGET = "widget"

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

    // Persist streak/reclaimed totals for the home-screen widget + refresh it.
    Function("writeWidgetData") { json: String ->
      val ctx = appContext.reactContext ?: return@Function
      ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_WIDGET, json).apply()
      try {
        ClockoutWidget.refresh(ctx)
      } catch (_: Throwable) {
      }
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
      val ctx = appContext.reactContext
      if (ctx != null) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
          .putBoolean(KEY_MONITORING, true).apply()
        ContextCompat.startForegroundService(ctx, Intent(ctx, ClockoutService::class.java))
      }
    }

    Function("stopMonitoring") {
      val ctx = appContext.reactContext
      if (ctx != null) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
          .putBoolean(KEY_MONITORING, false).apply()
        ctx.stopService(Intent(ctx, ClockoutService::class.java))
      }
    }

    // True if Clockout is exempt from battery optimization (won't be doze-killed).
    Function("isIgnoringBatteryOptimizations") {
      val ctx = appContext.reactContext ?: return@Function false
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(ctx.packageName)
    }

    // Show the system "allow background activity / ignore optimizations" prompt;
    // falls back to the battery-optimization list if the direct dialog is blocked.
    Function("requestIgnoreBatteryOptimizations") {
      val ctx = appContext.reactContext
      if (ctx != null) {
        val direct = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
          data = Uri.parse("package:${ctx.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
          if (direct.resolveActivity(ctx.packageManager) != null) {
            ctx.startActivity(direct)
          } else {
            ctx.startActivity(
              Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
          }
        } catch (_: Throwable) {
        }
      }
    }

    // Smart-suggest: most-used launchable apps over the last `days`, as
    // [{"pkg","label","minutes","icon"}] sorted desc — icon is the real installed
    // app's launcher glyph as a PNG data URI. Needs Usage access; empty otherwise.
    Function("topPackages") { days: Int ->
      val ctx = appContext.reactContext ?: return@Function "[]"
      val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val end = System.currentTimeMillis()
      val begin = end - days.toLong() * 86_400_000L
      val pm = ctx.packageManager
      val self = ctx.packageName
      val totals = HashMap<String, Long>()
      try {
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, begin, end) ?: emptyList()
        for (s in stats) {
          if (s.packageName == self) continue
          if (s.totalTimeInForeground <= 0) continue
          totals[s.packageName] = (totals[s.packageName] ?: 0L) + s.totalTimeInForeground
        }
      } catch (_: Throwable) {
        return@Function "[]"
      }
      val arr = JSONArray()
      totals.entries
        .filter { pm.getLaunchIntentForPackage(it.key) != null } // has a UI / launcher entry
        .sortedByDescending { it.value }
        .take(12)
        .forEach { (pkg, ms) ->
          val label = try {
            pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
          } catch (_: Throwable) {
            pkg.substringAfterLast('.')
          }
          val obj = JSONObject().put("pkg", pkg).put("label", label).put("minutes", ms / 60_000L)
          iconDataUri(pm, pkg, 96)?.let { obj.put("icon", it) }
          arr.put(obj)
        }
      arr.toString()
    }

    // Auto-learn work hours: infer typical first/last foreground time of the given
    // work packages over the last `days`. Returns
    // {"start","end","days":[..],"samples","confidence"} or {} if too little data.
    Function("usagePattern") { packagesJson: String, days: Int ->
      val ctx = appContext.reactContext ?: return@Function "{}"
      val pkgs = try {
        val a = JSONArray(packagesJson)
        (0 until a.length()).map { a.getString(it) }.toHashSet()
      } catch (_: Throwable) {
        hashSetOf<String>()
      }
      if (pkgs.isEmpty()) return@Function "{}"

      val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val end = System.currentTimeMillis()
      val begin = end - days.toLong() * 86_400_000L
      val firstByDay = HashMap<Long, Int>()
      val lastByDay = HashMap<Long, Int>()
      val weekdayCount = IntArray(7)
      val cal = Calendar.getInstance()

      try {
        val events = usm.queryEvents(begin, end)
        val ev = UsageEvents.Event()
        while (events.hasNextEvent()) {
          events.getNextEvent(ev)
          if (ev.eventType != UsageEvents.Event.MOVE_TO_FOREGROUND &&
            ev.eventType != UsageEvents.Event.ACTIVITY_RESUMED
          ) continue
          if (!pkgs.contains(ev.packageName)) continue
          cal.timeInMillis = ev.timeStamp
          val dayKey = cal.get(Calendar.YEAR) * 1000L + cal.get(Calendar.DAY_OF_YEAR)
          val minute = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
          val weekday = cal.get(Calendar.DAY_OF_WEEK) - 1 // 0=Sun … 6=Sat
          if (!firstByDay.containsKey(dayKey)) {
            firstByDay[dayKey] = minute
            weekdayCount[weekday]++
          } else if (minute < firstByDay[dayKey]!!) {
            firstByDay[dayKey] = minute
          }
          if (!lastByDay.containsKey(dayKey) || minute > lastByDay[dayKey]!!) {
            lastByDay[dayKey] = minute
          }
        }
      } catch (_: Throwable) {
        return@Function "{}"
      }

      val samples = firstByDay.size
      if (samples == 0) return@Function "{}"

      val firsts = firstByDay.values.sorted()
      val lasts = lastByDay.values.sorted()
      var startMin = (firsts[firsts.size / 2] / 30) * 30 // median, floored to 30m
      var endMin = ((lasts[lasts.size / 2] + 29) / 30) * 30 // median, ceiled to 30m
      if (endMin <= startMin) endMin = (startMin + 60).coerceAtMost(1439)

      val threshold = if (samples >= 10) 2 else 1
      val daysArr = JSONArray()
      for (w in 0 until 7) if (weekdayCount[w] >= threshold) daysArr.put(w)

      val confidence = (samples.toDouble() / (days.toDouble() * 0.7)).coerceIn(0.0, 1.0)

      JSONObject()
        .put("start", startMin)
        .put("end", endMin)
        .put("days", daysArr)
        .put("samples", samples)
        .put("confidence", confidence)
        .toString()
    }
  }

  // Render an installed app's launcher icon to a PNG data URI (square sizePx),
  // so JS can show the real app logo. Returns null if the icon can't be loaded.
  private fun iconDataUri(pm: PackageManager, pkg: String, sizePx: Int): String? {
    return try {
      val drawable = pm.getApplicationIcon(pkg)
      val bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bmp)
      drawable.setBounds(0, 0, sizePx, sizePx)
      drawable.draw(canvas)
      val out = ByteArrayOutputStream()
      bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
      bmp.recycle()
      "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    } catch (_: Throwable) {
      null
    }
  }
}
