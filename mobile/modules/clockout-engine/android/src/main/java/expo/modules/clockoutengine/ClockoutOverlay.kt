package expo.modules.clockoutengine

import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.util.Calendar

// Draws the after-hours nudge as a full-screen system overlay and reports the
// user's choice ("reclaimed" / "opened"). This mirrors the in-app nudge
// (components/Nudge.tsx) so the real interception looks identical to the preview:
// eyebrow → title → subtitle, a breathing focal point, then a gentle choice.
class ClockoutOverlay(private val ctx: Context) {
  private val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val main = Handler(Looper.getMainLooper())
  private var view: View? = null

  // Palette — mirrors theme/colors.ts.
  // Named bgColor/fgColor (not background/foreground) so they don't shadow
  // View.background / View.foreground (both Drawable) inside apply { } blocks.
  private val bgColor = Color.parseColor("#0A0A0A")
  private val card = Color.parseColor("#171717")
  private val elevated = Color.parseColor("#1F1F1F")
  private val fgColor = Color.parseColor("#FAFAFA")
  private val muted = Color.parseColor("#A3A3A3")
  private val subtle = Color.parseColor("#525252")
  private val orange = Color.parseColor("#F97316")
  private val onPrimary = Color.parseColor("#0A0A0A")

  private val black = Typeface.create("sans-serif-black", Typeface.NORMAL)
  private val medium = Typeface.create("sans-serif-medium", Typeface.NORMAL)

  private fun dp(v: Int): Int = (v * ctx.resources.displayMetrics.density).toInt()
  private fun dpf(v: Float): Float = v * ctx.resources.displayMetrics.density
  private fun withAlpha(color: Int, frac: Float): Int {
    val a = (255 * frac).toInt().coerceIn(0, 255)
    return (a shl 24) or (color and 0x00FFFFFF)
  }

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
      cornerRadius = dpf(radius.toFloat())
    }

  private fun lp(w: Int, h: Int, topMargin: Int = 0): LinearLayout.LayoutParams =
    LinearLayout.LayoutParams(w, h).apply { if (topMargin != 0) this.topMargin = dp(topMargin) }

  // Style the primary action ("Close & reclaim my evening") per Button.tsx:
  // dimmed bg-elevated/subtle while gated, then solid orange when ready.
  private fun stylePrimary(b: Button, enabled: Boolean) {
    b.background = pill(if (enabled) orange else elevated, 16)
    b.setTextColor(if (enabled) onPrimary else subtle)
  }

  // Ghost action ("Open anyway"): dimmed pill while gated, transparent when ready.
  private fun styleGhost(b: Button, enabled: Boolean) {
    b.background = if (enabled) null else pill(elevated, 16)
    b.setTextColor(if (enabled) muted else subtle)
    b.isAllCaps = !enabled // uppercase while gated (inactive label), normal when ready
    b.typeface = if (enabled) Typeface.DEFAULT_BOLD else black
  }

  private fun buildView(appLabel: String, strict: Boolean, onAction: (String) -> Unit): View {
    val mp = LinearLayout.LayoutParams.MATCH_PARENT
    val wc = LinearLayout.LayoutParams.WRAP_CONTENT

    val root = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setBackgroundColor(bgColor)
      setPadding(dp(32), dp(80), dp(32), dp(48))
    }

    fun weightSpacer() = View(ctx).apply { layoutParams = LinearLayout.LayoutParams(mp, 0, 1f) }

    // ── Top: context ─────────────────────────────────────────────
    val eyebrow = TextView(ctx).apply {
      text = "Boundary enforced"
      isAllCaps = true
      setTextColor(orange)
      textSize = 12f
      letterSpacing = 0.25f
      typeface = black
      gravity = Gravity.CENTER
    }
    val title = TextView(ctx).apply {
      text = "It's ${nowTime()}. Work's done."
      setTextColor(fgColor)
      textSize = 24f
      typeface = Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER
      layoutParams = lp(wc, wc, 8)
    }
    val subtitle = TextView(ctx).apply {
      val full = "Sure you want to open $appLabel?"
      text = SpannableString(full).apply {
        val i = full.indexOf(appLabel)
        if (i >= 0) {
          setSpan(StyleSpan(Typeface.BOLD), i, i + appLabel.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
          setSpan(ForegroundColorSpan(foreground), i, i + appLabel.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
      }
      setTextColor(muted)
      textSize = 14f
      gravity = Gravity.CENTER
      layoutParams = lp(wc, wc, 8)
    }
    val topZone = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      addView(eyebrow)
      addView(title)
      addView(subtitle)
    }

    // ── Middle: breathing ────────────────────────────────────────
    val rings = BreathingView(ctx)
    val status = TextView(ctx).apply {
      text = "Take a breath… 3"
      isAllCaps = true
      setTextColor(muted)
      textSize = 12f
      letterSpacing = 0.12f
      typeface = medium
      gravity = Gravity.CENTER
      layoutParams = lp(wc, wc, 12)
    }
    val middleZone = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      addView(rings, lp(dp(176), dp(176)))
      addView(status)
    }

    // ── Bottom: choices ──────────────────────────────────────────
    val reclaim = Button(ctx).apply {
      text = "Close & reclaim my evening"
      textSize = 14f
      typeface = black
      isAllCaps = true
      letterSpacing = 0.04f
      stateListAnimator = null
      setPadding(dp(20), dp(16), dp(20), dp(16))
      isEnabled = false
    }
    stylePrimary(reclaim, false)
    val open = Button(ctx).apply {
      text = "Open anyway"
      textSize = 14f
      stateListAnimator = null
      setPadding(dp(20), dp(16), dp(20), dp(16))
      isEnabled = false
      visibility = if (strict) View.GONE else View.VISIBLE
    }
    styleGhost(open, false)
    val strictNote = TextView(ctx).apply {
      text = "Strict Mode is on — locked until your next workday."
      setTextColor(subtle)
      textSize = 12f
      gravity = Gravity.CENTER
      layoutParams = lp(wc, wc, 12)
      visibility = if (strict) View.VISIBLE else View.GONE
    }
    val bottomZone = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      addView(reclaim, lp(mp, wc))
      addView(open, lp(mp, wc, 12))
      addView(strictNote)
    }

    root.addView(topZone, lp(mp, wc))
    root.addView(weightSpacer())
    root.addView(middleZone, lp(mp, wc))
    root.addView(weightSpacer())
    root.addView(bottomZone, lp(mp, wc))

    // On choice: collapse to the breathing + a confirmation, then act (matches
    // the in-app nudge's brief "done" state before it closes).
    var done = false
    fun choose(action: String) {
      if (done) return
      done = true
      subtitle.visibility = View.GONE
      reclaim.visibility = View.GONE
      open.visibility = View.GONE
      strictNote.visibility = View.GONE
      status.text = if (action == "reclaimed") "Evening reclaimed 🎉" else "Opened — logged"
      main.postDelayed({
        onAction(action)
        if (action == "reclaimed") goHome()
        dismiss()
      }, 1100)
    }
    reclaim.setOnClickListener { if (reclaim.isEnabled) choose("reclaimed") }
    open.setOnClickListener { if (open.isEnabled) choose("opened") }

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
          stylePrimary(reclaim, true)
          open.isEnabled = true
          styleGhost(open, true)
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

  // Concentric rings that gently pulse — the overlay's "breathing" focal point,
  // standing in for the in-app breathe.json Lottie.
  private inner class BreathingView(context: Context) : View(context) {
    private val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private var pulse = 0f
    private val animator = ValueAnimator.ofFloat(0f, 1f).apply {
      duration = 2600
      repeatCount = ValueAnimator.INFINITE
      repeatMode = ValueAnimator.REVERSE
      interpolator = AccelerateDecelerateInterpolator()
      addUpdateListener {
        pulse = it.animatedValue as Float
        invalidate()
      }
    }

    override fun onAttachedToWindow() {
      super.onAttachedToWindow()
      animator.start()
    }

    override fun onDetachedFromWindow() {
      animator.cancel()
      super.onDetachedFromWindow()
    }

    override fun onDraw(canvas: Canvas) {
      val cx = width / 2f
      val cy = height / 2f
      val maxR = minOf(cx, cy)

      // Outer halo — expands + fades with the pulse.
      stroke.color = withAlpha(orange, 0.10f + 0.07f * pulse)
      stroke.strokeWidth = dpf(1.5f)
      canvas.drawCircle(cx, cy, maxR * (0.80f + 0.18f * pulse), stroke)

      // Mid ring.
      stroke.color = withAlpha(orange, 0.24f)
      stroke.strokeWidth = dpf(2f)
      canvas.drawCircle(cx, cy, maxR * (0.62f + 0.08f * pulse), stroke)

      // Inner disc + accent border.
      fill.color = card
      canvas.drawCircle(cx, cy, maxR * 0.46f, fill)
      stroke.color = withAlpha(orange, 0.85f + 0.15f * pulse)
      stroke.strokeWidth = dpf(2f)
      canvas.drawCircle(cx, cy, maxR * 0.46f, stroke)
    }
  }
}
