package com.calora.ai

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap

/**
 * Old-architecture native module (this project has newArchEnabled=false).
 * JS talks to StepTrackerService only through here, and only through
 * SharedPreferences — there is no binder and no background JS execution.
 * Every method is a no-op-safe promise: on any failure JS falls back to
 * the foreground Expo Pedometer path, so a native failure can never
 * break tracking entirely.
 */
class StepTrackerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "StepTracker"

    private fun prefs(): SharedPreferences =
        reactApplicationContext.getSharedPreferences(
            StepTrackerService.PREFS_NAME,
            Context.MODE_PRIVATE
        )

    private fun serviceIntent(): Intent =
        Intent(reactApplicationContext, StepTrackerService::class.java)

    private fun startService() {
        val intent = serviceIntent()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(intent)
        } else {
            reactApplicationContext.startService(intent)
        }
    }

    @ReactMethod
    fun startTracking(promise: Promise) {
        try {
            startService()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        try {
            reactApplicationContext.stopService(serviceIntent())
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun getSteps(promise: Promise) {
        try {
            promise.resolve(currentStatus())
        } catch (e: Exception) {
            promise.reject("READ_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun startSession(type: String, promise: Promise) {
        try {
            val prefs = prefs()
            val lastSensor = prefs.getLong(StepTrackerService.KEY_LAST_SENSOR, -1L)
            val editor = prefs.edit()
            editor.putBoolean(StepTrackerService.KEY_SESSION_ACTIVE, true)
            editor.putBoolean(StepTrackerService.KEY_SESSION_PAUSED, false)
            editor.putString(StepTrackerService.KEY_SESSION_TYPE, type)
            editor.putLong(StepTrackerService.KEY_SESSION_ACCUMULATED, 0L)
            editor.putLong(StepTrackerService.KEY_SESSION_STEPS, 0L)
            editor.putLong(StepTrackerService.KEY_SESSION_ACCUMULATED_MS, 0L)
            editor.putLong(StepTrackerService.KEY_SESSION_PERIOD_STARTED, System.currentTimeMillis())
            if (lastSensor >= 0) {
                editor.putLong(StepTrackerService.KEY_SESSION_BASE, lastSensor)
                editor.putBoolean(StepTrackerService.KEY_SESSION_BASE_PENDING, false)
            } else {
                // No sensor reading yet: the service will treat its first
                // event as the baseline instead of counting the whole
                // since-boot total as session steps.
                editor.putBoolean(StepTrackerService.KEY_SESSION_BASE_PENDING, true)
            }
            editor.apply()
            startService()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SESSION_START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun pauseSession(promise: Promise) {
        try {
            val prefs = prefs()
            val now = System.currentTimeMillis()
            val periodStarted = prefs.getLong(StepTrackerService.KEY_SESSION_PERIOD_STARTED, 0L)
            val accumulatedMs = prefs.getLong(StepTrackerService.KEY_SESSION_ACCUMULATED_MS, 0L)
            val editor = prefs.edit()
            if (periodStarted > 0) {
                editor.putLong(
                    StepTrackerService.KEY_SESSION_ACCUMULATED_MS,
                    accumulatedMs + (now - periodStarted)
                )
            }
            editor.putBoolean(StepTrackerService.KEY_SESSION_PAUSED, true)
            editor.putLong(StepTrackerService.KEY_SESSION_PERIOD_STARTED, 0L)
            // Accumulated steps stay as last written by the service.
            editor.putLong(
                StepTrackerService.KEY_SESSION_ACCUMULATED,
                prefs.getLong(StepTrackerService.KEY_SESSION_STEPS, 0L)
            )
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SESSION_PAUSE_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun resumeSession(promise: Promise) {
        try {
            val prefs = prefs()
            val lastSensor = prefs.getLong(StepTrackerService.KEY_LAST_SENSOR, -1L)
            val editor = prefs.edit()
            editor.putBoolean(StepTrackerService.KEY_SESSION_PAUSED, false)
            editor.putLong(StepTrackerService.KEY_SESSION_PERIOD_STARTED, System.currentTimeMillis())
            if (lastSensor >= 0) {
                editor.putLong(StepTrackerService.KEY_SESSION_BASE, lastSensor)
                editor.putBoolean(StepTrackerService.KEY_SESSION_BASE_PENDING, false)
            } else {
                editor.putBoolean(StepTrackerService.KEY_SESSION_BASE_PENDING, true)
            }
            editor.apply()
            startService()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SESSION_RESUME_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stopSession(promise: Promise) {
        try {
            val steps = prefs().getLong(StepTrackerService.KEY_SESSION_STEPS, 0L)
            val editor = prefs().edit()
            editor.putBoolean(StepTrackerService.KEY_SESSION_ACTIVE, false)
            editor.putBoolean(StepTrackerService.KEY_SESSION_PAUSED, false)
            editor.putString(StepTrackerService.KEY_SESSION_TYPE, null)
            editor.putLong(StepTrackerService.KEY_SESSION_ACCUMULATED, 0L)
            editor.putLong(StepTrackerService.KEY_SESSION_STEPS, 0L)
            editor.putLong(StepTrackerService.KEY_SESSION_ACCUMULATED_MS, 0L)
            editor.putLong(StepTrackerService.KEY_SESSION_PERIOD_STARTED, 0L)
            editor.apply()
            // Daily tracking keeps running; only the session ends.
            promise.resolve(steps.toDouble())
        } catch (e: Exception) {
            promise.reject("SESSION_STOP_FAILED", e.message, e)
        }
    }

    private fun currentStatus(): WritableMap {
        val prefs = prefs()
        val active = prefs.getBoolean(StepTrackerService.KEY_SESSION_ACTIVE, false)
        val paused = prefs.getBoolean(StepTrackerService.KEY_SESSION_PAUSED, false)
        val periodStarted = prefs.getLong(StepTrackerService.KEY_SESSION_PERIOD_STARTED, 0L)
        val accumulatedMs = prefs.getLong(StepTrackerService.KEY_SESSION_ACCUMULATED_MS, 0L)
        val elapsedMs = if (active && !paused && periodStarted > 0) {
            accumulatedMs + (System.currentTimeMillis() - periodStarted)
        } else {
            accumulatedMs
        }
        val map: WritableMap = Arguments.createMap()
        map.putDouble("todaySteps", prefs.getLong(StepTrackerService.KEY_TODAY_STEPS, 0L).toDouble())
        map.putDouble("sessionSteps", prefs.getLong(StepTrackerService.KEY_SESSION_STEPS, 0L).toDouble())
        map.putBoolean("sessionActive", active)
        map.putBoolean("sessionPaused", paused)
        val type = prefs.getString(StepTrackerService.KEY_SESSION_TYPE, null)
        if (type != null) map.putString("sessionType", type) else map.putNull("sessionType")
        map.putDouble("elapsedSeconds", elapsedMs / 1000.0)
        map.putBoolean("sensorAvailable", prefs.getBoolean(StepTrackerService.KEY_SENSOR_AVAILABLE, true))
        return map
    }
}
