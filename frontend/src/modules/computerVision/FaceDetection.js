import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

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