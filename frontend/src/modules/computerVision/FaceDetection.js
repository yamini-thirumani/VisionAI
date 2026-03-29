import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

// Keep lightweight state across frames so we can detect consistent occlusion patterns.
const _earHistory = [];
const _MAX_HISTORY = 12;

/**
 * Detect possible glasses based on eye-opening ratio (EAR-like metric).
 * - Uses MediaPipe FaceMesh landmarks near the eye contours.
 * - Confidence increases when the EAR stays unusually low across multiple frames.
 *
 * @param {Array} landmarks MediaPipe face landmarks
 * @returns {{ detected: boolean, confidence: number }}
 */
export function detectGlasses(landmarks) {
  try {
    if (!landmarks || !Array.isArray(landmarks)) {
      return { detected: false, confidence: 0 };
    }

    const safe = (idx) => landmarks[idx];
    const dist = (a, b) => {
      if (!a || !b) return NaN;
      if (typeof a.x !== 'number' || typeof a.y !== 'number') return NaN;
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    // Outer eye corners (provided)
    const L_OUT = safe(33);
    const L_IN = safe(133);
    const R_OUT = safe(362);
    const R_IN = safe(263);

    // Upper/lower lid landmarks (provided)
    const L_UP = safe(159);
    const L_LOW = safe(145);
    const R_UP = safe(386);
    const R_LOW = safe(374);

    const leftH = dist(L_OUT, L_IN);
    const leftV = dist(L_UP, L_LOW);
    const rightH = dist(R_OUT, R_IN);
    const rightV = dist(R_UP, R_LOW);

    if (![leftH, leftV, rightH, rightV].every((v) => Number.isFinite(v) && v > 0)) {
      return { detected: false, confidence: 0 };
    }

    // Simplified EAR: vertical opening divided by horizontal eye width.
    const leftEAR = leftV / leftH;
    const rightEAR = rightV / rightH;
    const ear = (leftEAR + rightEAR) / 2;

    if (!Number.isFinite(ear) || ear <= 0) {
      return { detected: false, confidence: 0 };
    }

    // Track EAR over time to detect persistent occlusion.
    _earHistory.push(ear);
    while (_earHistory.length > _MAX_HISTORY) _earHistory.shift();

    const EAR_LOW_THRESHOLD = 0.12;
    const isLow = ear < EAR_LOW_THRESHOLD;
    const lowCount = _earHistory.reduce((acc, v) => acc + (v < EAR_LOW_THRESHOLD ? 1 : 0), 0);
    const consistency = _earHistory.length ? lowCount / _earHistory.length : 0;

    // Confidence grows with how low the current EAR is, and with consistency across frames.
    const earConfidence = Math.max(0, Math.min(1, (EAR_LOW_THRESHOLD - ear) / EAR_LOW_THRESHOLD));
    const confidence = Math.max(0, Math.min(1, 0.65 * earConfidence + 0.35 * consistency));

    return {
      detected: isLow && confidence >= 0.6,
      confidence
    };
  } catch {
    return { detected: false, confidence: 0 };
  }
}

class FaceDetection {
  constructor() {
    this.faceMesh = null;
    this.camera = null;
  }

  async initialize(videoElement, onResults) {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults(onResults);

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        await this.faceMesh.send({ image: videoElement });
      },
      width: 1280,
      height: 720
    });

    await this.camera.start();
  }

  stop() {
    if (this.camera) {
      this.camera.stop();
    }
  }
}

export default FaceDetection;