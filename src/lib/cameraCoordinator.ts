/**
 * SmartView Pro™ - Camera Subsystem Coordinator
 * Milestone: SV-003 Camera Acquisition & Local Media Persistence
 * Walnus Global Ventures
 *
 * Dedicated camera coordinator isolating hardware/WebRTC/Capacitor camera details.
 * Manages:
 * - Camera device lifecycle (init, stream bind, stop tracks, release)
 * - Coherent lifecycle states: Idle, Initializing, Ready, Capturing, CaptureSuccess, CaptureError, PermissionRequired, CameraUnavailable
 * - Collision-resistant capture naming (UUID + Survey ID prefix, never clock-only)
 * - Safe aspect ratio capture & metadata extraction
 */

import { CameraLifecycleState, CaptureType, SurveyCapture } from '../types';

export interface CameraCoordinatorOptions {
  facingMode?: 'environment' | 'user';
  aspectRatio?: '4:3' | '1:1' | 'full';
  onStateChange?: (state: CameraLifecycleState, errorMessage?: string) => void;
}

export class CameraCoordinator {
  private stream: MediaStream | null = null;
  private state: CameraLifecycleState = 'Idle';
  private errorMessage: string | null = null;
  private facingMode: 'environment' | 'user' = 'environment';
  private aspectRatio: '4:3' | '1:1' | 'full' = 'full';
  private onStateChange?: (state: CameraLifecycleState, errorMessage?: string) => void;

  constructor(options?: CameraCoordinatorOptions) {
    if (options?.facingMode) this.facingMode = options.facingMode;
    if (options?.aspectRatio) this.aspectRatio = options.aspectRatio;
    this.onStateChange = options?.onStateChange;
  }

  public getState(): CameraLifecycleState {
    return this.state;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public setStateListener(listener: (state: CameraLifecycleState, errorMessage?: string) => void) {
    this.onStateChange = listener;
  }

  private transition(newState: CameraLifecycleState, error?: string) {
    this.state = newState;
    this.errorMessage = error || null;
    if (this.onStateChange) {
      this.onStateChange(newState, error);
    }
  }

  /**
   * Initializes the camera preview stream with lifecycle tracking and permission error handling.
   */
  public async initializeCamera(videoElement?: HTMLVideoElement | null): Promise<MediaStream | null> {
    this.transition('Initializing');

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.transition('CameraUnavailable', 'Camera hardware or media devices API is unavailable on this system.');
      return null;
    }

    // Stop existing stream if any
    this.stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = mediaStream;

      if (videoElement) {
        videoElement.srcObject = mediaStream;
        videoElement.setAttribute('playsinline', 'true');
        videoElement.muted = true;
        await videoElement.play().catch(() => {});
      }

      this.transition('Ready');
      return mediaStream;
    } catch (err: any) {
      console.warn('[CameraCoordinator] Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.transition('PermissionRequired', 'Camera permission was denied. Please allow camera access in browser/device settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.transition('CameraUnavailable', 'No camera sensor was detected on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        this.transition('CameraUnavailable', 'Camera hardware is currently in use by another application or sensor is busy.');
      } else {
        this.transition('CaptureError', `Camera initialization failed: ${err.message || 'Unknown error'}`);
      }
      return null;
    }
  }

  /**
   * Generates a collision-resistant unique identifier for the capture.
   * Format: cap_<surveyId>_<timestamp>_<uuidPart>
   */
  public generateCaptureId(surveyId: string): string {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const timeStamp = Date.now().toString(36);
    const cleanSurvey = (surveyId || 'survey').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
    return `cap_${cleanSurvey}_${timeStamp}_${randomHex}`;
  }

  /**
   * Captures a still photo from the live video stream element.
   * Returns a domain SurveyCapture entity + full-resolution image data URL.
   */
  public captureStill(
    videoElement: HTMLVideoElement,
    surveyId: string,
    captureType: CaptureType = 'STANDARD_STILL',
    notes?: string
  ): { capture: SurveyCapture; dataUrl: string } {
    if (!surveyId) {
      this.transition('CaptureError', 'Active Survey context is required to capture photos.');
      throw new Error('[CameraCoordinator] Active Survey context is required to capture photos.');
    }

    if (this.state !== 'Ready') {
      this.transition('CaptureError', 'Cannot capture: camera is not in Ready state.');
      throw new Error('[CameraCoordinator] Camera is not ready for capture.');
    }

    this.transition('Capturing');

    const rawWidth = videoElement.videoWidth || 1280;
    const rawHeight = videoElement.videoHeight || 720;

    let srcX = 0;
    let srcY = 0;
    let srcW = rawWidth;
    let srcH = rawHeight;

    if (this.aspectRatio === '1:1') {
      const side = Math.min(rawWidth, rawHeight);
      srcX = (rawWidth - side) / 2;
      srcY = (rawHeight - side) / 2;
      srcW = side;
      srcH = side;
    } else if (this.aspectRatio === '4:3') {
      const targetRatio = 4 / 3;
      const currentRatio = rawWidth / rawHeight;
      if (currentRatio > targetRatio) {
        srcW = rawHeight * targetRatio;
        srcX = (rawWidth - srcW) / 2;
      } else {
        srcH = rawWidth / targetRatio;
        srcY = (rawHeight - srcH) / 2;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(srcW);
    canvas.height = Math.round(srcH);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.transition('CaptureError', 'Failed to allocate canvas drawing context for image capture.');
      throw new Error('Canvas 2D context creation failed');
    }

    ctx.drawImage(videoElement, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

    // Generate high quality JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const captureId = this.generateCaptureId(surveyId);
    const localPath = `survey_media/${surveyId}/${captureId}.jpg`;

    // Generate thumbnail
    const thumbCanvas = document.createElement('canvas');
    const thumbScale = Math.min(180 / canvas.width, 180 / canvas.height);
    thumbCanvas.width = Math.round(canvas.width * thumbScale);
    thumbCanvas.height = Math.round(canvas.height * thumbScale);
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }
    const thumbnailDataUrl = thumbCtx ? thumbCanvas.toDataURL('image/jpeg', 0.7) : undefined;

    const capture: SurveyCapture = {
      id: captureId,
      surveyId,
      localPath,
      captureType,
      width: canvas.width,
      height: canvas.height,
      fileSizeBytes: Math.round(dataUrl.length * 0.75),
      createdAtEpochMs: Date.now(),
      notes,
      thumbnailDataUrl,
      syncStatus: 'pending',
    };

    this.transition('CaptureSuccess');
    return { capture, dataUrl };
  }

  /**
   * Stops all active camera stream tracks and releases hardware resources.
   */
  public stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      this.stream = null;
    }
    this.transition('Idle');
  }

  public release() {
    this.stopCamera();
    this.onStateChange = undefined;
  }
}
