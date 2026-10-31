package com.walnus.smartview.camera;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;

/**
 * SmartView Pro™ - CameraX Coordinator & Controller
 * Milestone: SV-003
 *
 * Dedicated camera abstraction responsible for:
 * - Camera initialization state
 * - Collision-resistant filename generation
 * - Lifecycle-aware session coordination
 * - Capture state tracking (Idle, Initializing, Ready, Capturing, CaptureSuccess, CaptureError, PermissionRequired, CameraUnavailable)
 */
public class CameraXCoordinator {

    private static final String TAG = "CameraXCoordinator";

    public enum CameraState {
        IDLE,
        INITIALIZING,
        READY,
        CAPTURING,
        CAPTURE_SUCCESS,
        CAPTURE_ERROR,
        PERMISSION_REQUIRED,
        CAMERA_UNAVAILABLE
    }

    public interface StateListener {
        void onStateChanged(CameraState newState, @Nullable String errorMessage);
    }

    private CameraState currentState = CameraState.IDLE;
    private StateListener stateListener;
    private final Context context;

    public CameraXCoordinator(Context context) {
        this.context = context.getApplicationContext();
    }

    public void setStateListener(StateListener listener) {
        this.stateListener = listener;
    }

    public CameraState getCurrentState() {
        return currentState;
    }

    private void updateState(CameraState state, @Nullable String error) {
        this.currentState = state;
        if (stateListener != null) {
            stateListener.onStateChanged(state, error);
        }
    }

    /**
     * Generates a collision-resistant local storage file for survey capture.
     * Enforces non-clock-only naming (UUID + Survey ID prefix).
     */
    public File createCaptureOutputFile(@NonNull String surveyId) {
        File mediaDir = new File(context.getFilesDir(), "survey_media/" + surveyId);
        if (!mediaDir.exists()) {
            mediaDir.mkdirs();
        }
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        String collisionResistantId = UUID.randomUUID().toString().substring(0, 8);
        String fileName = "CAP_" + surveyId + "_" + timestamp + "_" + collisionResistantId + ".jpg";
        return new File(mediaDir, fileName);
    }

    public void onPermissionGranted() {
        Log.i(TAG, "Camera permission granted. Transitioning to INITIALIZING");
        updateState(CameraState.INITIALIZING, null);
    }

    public void onPermissionDenied() {
        Log.w(TAG, "Camera permission denied.");
        updateState(CameraState.PERMISSION_REQUIRED, "Camera runtime permission was denied.");
    }

    public void onCameraReady() {
        Log.i(TAG, "CameraX provider bound and preview active.");
        updateState(CameraState.READY, null);
    }

    public void onCaptureInitiated() {
        Log.i(TAG, "Still image capture initiated.");
        updateState(CameraState.CAPTURING, null);
    }

    public void onCaptureCompleted(File outputFile) {
        Log.i(TAG, "Capture completed successfully: " + outputFile.getAbsolutePath());
        updateState(CameraState.CAPTURE_SUCCESS, null);
    }

    public void onCaptureFailed(Exception exception) {
        Log.e(TAG, "Capture failed", exception);
        updateState(CameraState.CAPTURE_ERROR, exception.getMessage());
    }

    public void release() {
        Log.i(TAG, "Releasing camera coordinator resources.");
        updateState(CameraState.IDLE, null);
    }
}
