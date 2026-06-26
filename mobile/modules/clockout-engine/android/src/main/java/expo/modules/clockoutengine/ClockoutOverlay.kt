package expo.modules.clockoutengine

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.util.Calendar

// Draws the after-hours nudge as a full-screen system overlay and reports the
// user's choice ("reclaimed" / "opened").
class ClockoutOverlay(private val ctx: Context) {
  private val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val main = Handler(Looper.getMainLooper())
  private var view: View? = null

  private fun dp(v: Int): Int = (v * ctx.resources.displayMetrics.density).toInt()

  fun show(appLabel: String, strict: Boolean, onAction: (String) -> Unit) {
    main.post {
      if (view != null) return@post
      try {
        val root = buildView(appLabel, strict, onAction)
        wm.addView(root, params())
        view = root
      } catch (_: Throwable) {
      }
    }
  }

  fun dismiss() {
    main.post {
      val v = view ?: return@post
      try {
        wm.removeView(v)
      } catch (_: Throwable) {
      }
      view = null
    }
  }

  private fun params(): WindowManager.LayoutParams {
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }
    return WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      type,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    ).apply { gravity = Gravity.CENTER }
  }

  private fun nowTime(): String {
    val cal = Calendar.getInstance()
    val h = cal.get(Calendar.HOUR_OF_DAY)
    val m = cal.get(Calendar.MINUTE)
    val ap = if (h >= 12) "PM" else "AM"
    val hh = if (h % 12 == 0) 12 else h % 12
    return "$hh:${m.toString().padStart(2, '0')} $ap"
  }

  private fun pill(color: Int, radius: Int): GradientDrawable =
    GradientDrawable().apply {
      setColor(color)
      cornerRadius = dp(radius).toFloat()
    }

  private fun buildView(appLabel: String, strict: Boolean, onAction: (String) -> Unit): View {
    val orange = Color.parseColor("#F97316")
    val root = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setBackgroundColor(Color.parseColor("#0A0A0A"))
      setPadding(dp(32), dp(48), dp(32), dp(48))
    }

    fun spacer(h: Int) = View(ctx).apply { layoutParams = LinearLayout.LayoutParams(1, dp(h)) }

    val eyebrow = TextView(ctx).apply {
      text = "BOUNDARY ENFORCED"
      setTextColor(orange)
      textSize = 11f
      letterSpacing = 0.2f
      gravity = Gravity.CENTER
    }
    val title = TextView(ctx).apply {
      text = "It's ${nowTime()}. Work's done."
      setTextColor(Color.parseColor("#FAFAFA"))
      textSize = 24f
      gravity = Gravity.CENTER
    }
    val sub = TextView(ctx).apply {
      text = "Sure you want to open $appLabel?"
      setTextColor(Color.parseColor("#A3A3A3"))
      textSize = 14f
      gravity = Gravity.CENTER
    }
    val status = TextView(ctx).apply {
      text = "Take a breath… 3"
      setTextColor(Color.parseColor("#A3A3A3"))
      textSize = 12f
      gravity = Gravity.CENTER
    }

    val reclaim = Button(ctx).apply {
      text = "Close & reclaim my evening"
      setTextColor(Color.parseColor("#0A0A0A"))
      background = pill(orange, 16)
      isAllCaps = false
      isEnabled = false
      alpha = 0.5f
      setOnClickListener {
        onAction("reclaimed")
        goHome()
        dismiss()
      }
    }
    val open = TextView(ctx).apply {
      text = "Open anyway"
      setTextColor(Color.parseColor("#A3A3A3"))
      textSize = 13f
      gravity = Gravity.CENTER
      setPadding(dp(8), dp(12), dp(8), dp(12))
      visibility = if (strict) View.GONE else View.VISIBLE
      isEnabled = false
      setOnClickListener {
        onAction("opened")
        dismiss()
      }
    }

    root.addView(eyebrow)
    root.addView(spacer(8))
    root.addView(title)
    root.addView(spacer(6))
    root.addView(sub)
    root.addView(spacer(28))
    root.addView(status)
    root.addView(spacer(28))
    root.addView(reclaim, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)))
    root.addView(spacer(8))
    root.addView(open)

    // 3-second breathing gate, then enable choices.
    var count = 3
    val ticker = object : Runnable {
      override fun run() {
        count -= 1
        if (count > 0) {
          status.text = "Take a breath… $count"
          main.postDelayed(this, 1000)
        } else {
          status.text = "Ready to decide"
          reclaim.isEnabled = true
          reclaim.alpha = 1f
          open.isEnabled = true
        }
      }
    }
    main.postDelayed(ticker, 1000)

    return root
  }

  private fun goHome() {
    try {
      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_HOME)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      ctx.startActivity(intent)
    } catch (_: Throwable) {
    }
  }
}
