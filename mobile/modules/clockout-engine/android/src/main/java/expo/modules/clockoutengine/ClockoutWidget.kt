package expo.modules.clockoutengine

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import org.json.JSONObject
import java.util.Calendar

// Home-screen widget: shows clocked-in/out status (from the work schedule) plus
// streak / evenings-reclaimed (pushed from JS via writeWidgetData). Tap = open app.
class ClockoutWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
    for (id in ids) render(context, mgr, id)
  }

  companion object {
    // Re-render every placed widget — called when JS pushes fresh data.
    fun refresh(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val ids = mgr.getAppWidgetIds(ComponentName(context, ClockoutWidget::class.java))
      for (id in ids) render(context, mgr, id)
    }

    private fun render(context: Context, mgr: AppWidgetManager, id: Int) {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val views = RemoteViews(context.packageName, R.layout.clockout_widget)

      val working = isWorking(prefs.getString(KEY_CONFIG, null))
      views.setTextViewText(R.id.widget_status, if (working) "On the clock" else "Clocked out")

      val sub = try {
        val w = JSONObject(prefs.getString(KEY_WIDGET, "{}") ?: "{}")
        val streak = w.optInt("streak", 0)
        val reclaimed = w.optInt("reclaimed", 0)
        when {
          reclaimed <= 0 -> if (working) "Guarding once you clock out" else "Your evening is yours"
          streak > 0 -> "🔥 $streak-day streak · $reclaimed reclaimed"
          else -> "$reclaimed evening${if (reclaimed == 1) "" else "s"} reclaimed"
        }
      } catch (_: Throwable) {
        "Your evenings, guarded"
      }
      views.setTextViewText(R.id.widget_sub, sub)

      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      if (launch != null) {
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        views.setOnClickPendingIntent(
          R.id.widget_root,
          PendingIntent.getActivity(context, 0, launch, flags),
        )
      }

      mgr.updateAppWidget(id, views)
    }

    // Are we inside the work schedule right now? (Clocked-in vs guarded.)
    private fun isWorking(configJson: String?): Boolean {
      if (configJson == null) return false
      return try {
        val c = JSONObject(configJson)
        val cal = Calendar.getInstance()
        val day = cal.get(Calendar.DAY_OF_WEEK) - 1
        val mins = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        val days = c.optJSONArray("days") ?: return false
        var isDay = false
        for (i in 0 until days.length()) if (days.optInt(i) == day) isDay = true
        isDay && mins >= c.optInt("start", 540) && mins < c.optInt("end", 1080)
      } catch (_: Throwable) {
        false
      }
    }
  }
}
