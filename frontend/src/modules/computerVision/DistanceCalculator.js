class DistanceCalculator {
  constructor() {
    this.AVERAGE_IPD = 63;

    // Per-device calibration constant K for the distance formula:
    //   D(cm) = K × (image_width / IPD_pixels)
    // If a calibrated K is stored, prefer that; otherwise fall back
    // to a conservative default around 100 as recommended.
    let storedK = NaN;
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('visionai_calibration_K');
      if (raw != null) {
        storedK = parseFloat(raw);
      }
    }

    this.calibrationFactor =
      Number.isFinite(storedK) && storedK > 0 ? storedK : 100;

    this.alpha = 0.2;
    this.smoothedDistance = null;
  }

  /**
   * Update and persist the per-device calibration factor (K).
   * This will be used by subsequent distance calculations.
   */
  setCalibrationFactor(k) {
    if (!Number.isFinite(k) || k <= 0) return;
    this.calibrationFactor = k;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('visionai_calibration_K', String(k));
    }
  }

  calculateDistance(landmarks, imageWidth) {
    if (!landmarks || !Array.isArray(landmarks) || !imageWidth) {
      return null;
    }

    // Use the full eye regions for a more stable IPD estimate
    const LEFT_EYE_CENTER = [33, 133, 160, 159, 158, 144, 145, 153];
    const RIGHT_EYE_CENTER = [263, 362, 385, 386, 387, 373, 374, 380];

    const getCentroid = (indices) => {
      const points = indices
        .map((i) => landmarks[i])
        .filter((p) => p && typeof p.x === 'number' && typeof p.y === 'number');
      if (!points.length) return null;
      const sum = points.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 }
      );
      return { x: sum.x / points.length, y: sum.y / points.length };
    };

    const leftCenter = getCentroid(LEFT_EYE_CENTER);
    const rightCenter = getCentroid(RIGHT_EYE_CENTER);
    if (!leftCenter || !rightCenter) return null;

    const dx = (rightCenter.x - leftCenter.x) * imageWidth;
    const dy = (rightCenter.y - leftCenter.y) * imageWidth;
    const pixelIPD = Math.sqrt(dx * dx + dy * dy);

    if (pixelIPD === 0) return null;

    const rawDistance = this.calibrationFactor * (imageWidth / pixelIPD);

    // Clamp to a reasonable human–screen range to avoid extreme
    // spikes from noisy landmark readings.
    const clamped = Math.max(20, Math.min(150, rawDistance));

    // Apply EMA smoothing to reduce jitter
    if (this.smoothedDistance == null) {
      this.smoothedDistance = clamped;
    } else {
      this.smoothedDistance =
        this.alpha * clamped + (1 - this.alpha) * this.smoothedDistance;
    }

    return Math.round(this.smoothedDistance);
  }

  validateDistance(distance) {
    if (distance == null || Number.isNaN(distance)) {
      return {
        isValid: false,
        status: 'unknown',
        message: 'Calculating distance…'
      };
    }

    // Enforce the medically preferred 40–60cm window.
    if (distance < 40) {
      return {
        isValid: false,
        status: 'too-close',
        message: 'Move back until you are about 50 cm from the screen.'
      };
    }

    if (distance > 60) {
      return {
        isValid: false,
        status: 'too-far',
        message: 'Move closer until you are about 50 cm from the screen.'
      };
    }

    return {
      isValid: true,
      status: 'optimal',
      message: 'Perfect distance (40–60 cm).'
    };
  }
}

export default DistanceCalculator;