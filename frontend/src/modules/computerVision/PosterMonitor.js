class PostureMonitor {
  calculateHeadPose(landmarks) {
    if (!landmarks) return { yaw: 0, pitch: 0, roll: 0 };

    // Key landmarks from MediaPipe Face Mesh (468-point model)
    const NOSE_TIP = landmarks[1];
    const CHIN = landmarks[152];
    const LEFT_EYE_INNER = landmarks[133];
    const RIGHT_EYE_INNER = landmarks[362];
    const LEFT_MOUTH = landmarks[61];
    const RIGHT_MOUTH = landmarks[291];

    if (
      !NOSE_TIP ||
      !CHIN ||
      !LEFT_EYE_INNER ||
      !RIGHT_EYE_INNER ||
      !LEFT_MOUTH ||
      !RIGHT_MOUTH
    ) {
      return { yaw: 0, pitch: 0, roll: 0 };
    }

    // Yaw: horizontal deviation of nose from the midline between inner eye corners
    const eyeCenterX = (LEFT_EYE_INNER.x + RIGHT_EYE_INNER.x) / 2;
    const yawNorm = (NOSE_TIP.x - eyeCenterX) / Math.abs(RIGHT_EYE_INNER.x - LEFT_EYE_INNER.x || 1);
    const yaw = yawNorm * 90;

    // Roll: tilt angle of the eye line
    const eyeAngle = Math.atan2(
      RIGHT_EYE_INNER.y - LEFT_EYE_INNER.y,
      RIGHT_EYE_INNER.x - LEFT_EYE_INNER.x
    );
    const roll = eyeAngle * (180 / Math.PI);

    // Pitch: relative vertical position of nose vs eye–mouth midline
    const midFaceY = (eyeCenterX + (LEFT_MOUTH.y + RIGHT_MOUTH.y) / 2) / 2;
    const faceHeight = Math.abs(CHIN.y - LEFT_EYE_INNER.y) || 1;
    const pitchNorm = (NOSE_TIP.y - midFaceY) / faceHeight;
    const pitch = pitchNorm * 90;

    return {
      yaw: Math.round(yaw),
      pitch: Math.round(pitch),
      roll: Math.round(roll)
    };
  }

  validatePosture(pose) {
    if (Math.abs(pose.yaw) > 15) return { isValid: false, message: 'Face forward' };
    if (Math.abs(pose.roll) > 10) return { isValid: false, message: 'Keep head straight' };
    return { isValid: true, message: 'Good posture' };
  }
}

export default PostureMonitor;