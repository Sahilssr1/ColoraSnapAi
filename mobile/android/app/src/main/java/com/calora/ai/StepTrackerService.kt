package com.calora.ai

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Android foreground service that keeps step counting alive when the app
 * is minimised or the screen is locked.
 *
 * Why a service, not just the Expo Pedometer JS listener: Expo's
 * Pedometer.watchStepCount only delivers updates while the JS process is
 * in the foreground. Once Android kills or suspends that process, steps
 * stop being counted. TYPE_STEP_COUNTER is a low-power hardware sensor
 * that keeps counting in the sensor hub, but an app only receives its
 * events while it has a live listener — a foreground service is the
 * platform-approved way to keep that listener (and the process) alive.
 * The service itself does almost nothing: it listens to the sensor,
 * writes totals to SharedPreferences, and shows the mandatory persistent
 * notification. All UI, session history and backend sync stay in JS,
 * and the backend API is unchanged (JS still posts an absolute daily
 * total to POST /analytics/steps).
 *
 * No data leaves the device from this service. Nothing is sent to any
 * server, and no location is collected — only step counts.
 */
class StepTrackerService : Service(), SensorEventListener {

    companion object {
        const val PREFS_NAME = "calora_step_tracker"
        const val CHANNEL_ID = "calora_step_tracking"
        const val NOTIFICATION_ID = 1001

        const val KEY_LAST_SENSOR = "last_sensor_value"
        const val KEY_BASELINE = "baseline_sensor_value"
        const val KEY_BASELINE_DATE = "baseline_date"
        const val KEY_TODAY_STEPS = "today_steps"
        const val KEY_SESSION_ACTIVE = "session_active"
        const val KEY_SESSION_PAUSED = "session_paused"
        const val KEY_SESSION_TYPE = "session_type"
        const val KEY_SESSION_BASE = "session_base_sensor_value"
        const val KEY_SESSION_BASE_PENDING = "session_base_pending"
        const val KEY_SESSION_ACCUMULATED = "session_accumulated_steps"
        const val KEY_SESSION_STEPS = "session_steps"
        const val KEY_SESSION_ACCUMULATED_MS = "session_accumulated_ms"
        const val KEY_SESSION_PERIOD_STARTED = "session_period_started_at"
        const val KEY_SENSOR_AVAILABLE = "sensor_available"
    }

    private var sensorManager: SensorManager? = null
    private var stepSensor: Sensor? = null
    private var lastNotificationUpdateMs: Long = 0

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        stepSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        // So JS can fall back to the Expo pedometer on devices (e.g. some
        // emulators) that have no hardware step counter at all.
        prefs().edit().putBoolean(KEY_SENSOR_AVAILABLE, stepSensor != null).apply()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 2-arg startForeground uses the foregroundServiceType declared in
        // the manifest ("health") on Android 14+, which is what requires
        // the FOREGROUND_SERVICE_HEALTH permission.
        startForeground(NOTIFICATION_ID, buildNotification(0, 0, null))
        val sensor = stepSensor
        if (sensor != null) {
            // SENSOR_DELAY_NORMAL is enough for step counting and is the
            // lowest-power rate that still reports every step batch.
            sensorManager?.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
        }
        // If the system kills the service, restart it: a killed tracker
        // that silently stops is exactly the bug being fixed.
        return START_STICKY
    }

    override fun onDestroy() {
        sensorManager?.unregisterListener(this)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type != Sensor.TYPE_STEP_COUNTER) return
        val sensorValue = event.values[0].toLong()
        val prefs = prefs()
        val today = todayString()
        val editor = prefs.edit()

        // Day rollover: the hardware counter is since boot, so "today" is
        // sensor value minus the value at the start of today.
        if (prefs.getString(KEY_BASELINE_DATE, null) != today) {
            editor.putString(KEY_BASELINE_DATE, today)
            editor.putLong(KEY_BASELINE, sensorValue)
            editor.putLong(KEY_TODAY_STEPS, 0L)
        }
        val baseline = prefs.getLong(KEY_BASELINE, sensorValue)
        // Sensor reboot can reset the counter to a lower value; never let
        // "today" go backwards because of that.
        val todaySteps = maxOf(0L, sensorValue - baseline)
        editor.putLong(KEY_LAST_SENSOR, sensorValue)
        editor.putLong(KEY_TODAY_STEPS, todaySteps)

        // Walk / run session accounting.
        if (prefs.getBoolean(KEY_SESSION_ACTIVE, false)) {
            if (prefs.getBoolean(KEY_SESSION_BASE_PENDING, false)) {
                // First sensor event after a session start: this value is
                // the session baseline, not steps taken.
                editor.putLong(KEY_SESSION_BASE, sensorValue)
                editor.putBoolean(KEY_SESSION_BASE_PENDING, false)
                editor.putLong(KEY_SESSION_STEPS, prefs.getLong(KEY_SESSION_ACCUMULATED, 0L))
            } else if (!prefs.getBoolean(KEY_SESSION_PAUSED, false)) {
                val base = prefs.getLong(KEY_SESSION_BASE, sensorValue)
                val accumulated = prefs.getLong(KEY_SESSION_ACCUMULATED, 0L)
                val sessionSteps = maxOf(0L, accumulated + (sensorValue - base))
                editor.putLong(KEY_SESSION_STEPS, sessionSteps)
            }
        }
        editor.apply()

        val sessionSteps = prefs.getLong(KEY_SESSION_STEPS, 0L)
        val sessionType = prefs.getString(KEY_SESSION_TYPE, null)
        val sessionActive = prefs.getBoolean(KEY_SESSION_ACTIVE, false)
        updateNotificationThrottled(todaySteps, sessionSteps, if (sessionActive) sessionType else null)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Step counter accuracy changes do not affect counting.
    }

    private fun prefs(): SharedPreferences =
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun todayString(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Step tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows while SnapCalora is counting your steps in the background."
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(todaySteps: Long, sessionSteps: Long, sessionType: String?): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val text = if (sessionType != null) {
            val label = if (sessionType == "run") "Running" else "Walking"
            "$label • $sessionSteps steps • $todaySteps steps today"
        } else {
            "$todaySteps steps today"
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SnapCalora is tracking")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotificationThrottled(todaySteps: Long, sessionSteps: Long, sessionType: String?) {
        val now = System.currentTimeMillis()
        // Step events can arrive in bursts; re-posting the notification on
        // every single step is wasteful. 5 seconds is plenty for a
        // persistent status notification.
        if (now - lastNotificationUpdateMs < 5000) return
        lastNotificationUpdateMs = now
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(todaySteps, sessionSteps, sessionType))
    }
}
