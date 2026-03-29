import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FaceDetection from '../modules/computerVision/FaceDetection';
import DistanceCalculator from '../modules/computerVision/DistanceCalculator';
import { userApi } from '../api/userApi';
import {
  HiOutlineCreditCard,
  HiOutlineFaceSmile,
  HiOutlineCalculator
} from 'react-icons/hi2';
import { markCalibrationCompleteOnDevice } from '../utils/calibration';

function CalibrationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/dashboard';
  const videoRef = useRef(null);
  const faceDetection = useRef(null);
  const distanceCalc = useRef(new DistanceCalculator());

  const [ipdPixels, setIpdPixels] = useState(null);
  const [imageWidth, setImageWidth] = useState(null);
  const [distanceCm, setDistanceCm] = useState('50');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('Face the camera, then follow the 3 steps on the right.');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        faceDetection.current = new FaceDetection();
        await faceDetection.current.initialize(videoRef.current, handleFaceResults);
      } catch (e) {
        if (!mounted) return;
        console.error('Calibration init error:', e);
        setError(
          e?.name === 'NotAllowedError' || /permission/i.test(e?.message || '')
            ? 'Camera access was denied. Please allow camera permissions in your browser and reload.'
            : 'Unable to start calibration on this device. Please check camera permissions and reload.'
        );
      }
    };

    init();

    return () => {
      mounted = false;
      if (faceDetection.current) {
        faceDetection.current.stop();
      }
    };
  }, []);

  const handleFaceResults = (results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }
    const landmarks = results.multiFaceLandmarks[0];
    const width = results.image?.width || videoRef.current?.videoWidth || 1280;

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
    if (!leftCenter || !rightCenter) return;

    const dx = (rightCenter.x - leftCenter.x) * width;
    const dy = (rightCenter.y - leftCenter.y) * width;
    const pixelIPD = Math.sqrt(dx * dx + dy * dy);

    if (!Number.isFinite(pixelIPD) || pixelIPD <= 0) return;

    setIpdPixels(pixelIPD);
    setImageWidth(width);
  };

  const handleCalibrate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numericDistance = parseFloat(distanceCm);
    if (!numericDistance || numericDistance <= 20 || numericDistance > 200) {
      setError('Please enter a realistic distance between 30 cm and 150 cm.');
      return;
    }
    if (!ipdPixels || !imageWidth) {
      setError('Unable to detect your eyes reliably. Please ensure your face is clearly visible.');
      return;
    }

    // K = distance_cm × IPD_pixels / image_width
    const K = (numericDistance * ipdPixels) / imageWidth;
    if (!Number.isFinite(K) || K <= 0) {
      setError('Calibration failed due to unstable measurements. Please try again.');
      return;
    }

    setSaving(true);
    try {
      distanceCalc.current.setCalibrationFactor(K);
      markCalibrationCompleteOnDevice();
      const uid = user?.id || user?._id;
      if (uid) {
        await userApi.updateProfile(uid, {
          calibration: { K }
        });
      }
      setSuccess(`Saved. Distance uses K ≈ ${K.toFixed(1)} on this device.`);
      setMessage('Calibration complete. You can run the vision test with meaningful letter sizes.');
    } catch (e) {
      console.error('Error saving calibration:', e);
      const apiErrors = e?.response?.data?.errors;
      const firstDetail =
        Array.isArray(apiErrors) && apiErrors.length > 0
          ? apiErrors.map((x) => x.message || x.field).filter(Boolean).join(' ')
          : null;
      const apiMessage = e?.response?.data?.message;
      setError(
        firstDetail ||
          apiMessage ||
          (e?.message?.includes('Network Error')
            ? 'Cannot reach the server. Check that the API is running and VITE_API_URL is set if needed.'
            : 'Unable to save calibration at this time. Please try again later.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-2">
        Distance calibration
      </h1>
      <div className="text-sm text-slate-700 mb-4 max-w-2xl space-y-3 leading-relaxed">
        <p>
          <strong className="text-slate-900">What it is for:</strong> The app estimates how far you sit from
          the screen. Snellen letter size depends on that distance. Calibration links what the camera sees
          (your face width in pixels) to a real distance in centimetres, using a credit card for scale. That
          is a <strong>geometry adjustment</strong>, not training or tuning of an AI model.
        </p>
        <p className="text-xs text-slate-600">
          Do this once per device. If you skip it, letter size uses a default viewing distance (less exact).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-900">
            <video
              ref={videoRef}
              className="w-full h-64 md:h-72 object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/50 to-transparent" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineCreditCard className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
              <h2 className="text-sm font-semibold">Match card size</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Hold a real card on the screen. Zoom until it matches the box.
            </p>
            <div className="flex justify-center">
              <div className="border-2 border-dashed border-emerald-500 rounded-md w-40 h-24 flex items-center justify-center bg-emerald-50">
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Credit card size
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 text-center text-xs mb-2">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
              <HiOutlineCreditCard className="h-8 w-8 mx-auto text-emerald-600 mb-1" aria-hidden />
              <p className="font-semibold text-slate-800">1. Match card</p>
              <p className="text-slate-500 mt-0.5">Same width as box</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
              <HiOutlineFaceSmile className="h-8 w-8 mx-auto text-blue-600 mb-1" aria-hidden />
              <p className="font-semibold text-slate-800">2. Face visible</p>
              <p className="text-slate-500 mt-0.5">Eyes on camera</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
              <HiOutlineCalculator className="h-8 w-8 mx-auto text-violet-600 mb-1" aria-hidden />
              <p className="font-semibold text-slate-800">3. Type cm + Calibrate</p>
              <p className="text-slate-500 mt-0.5">How far you sit</p>
            </div>
          </div>
          <h2 className="text-lg font-semibold">Your distance (cm)</h2>
          <p className="text-sm text-gray-600">
            Sit as you will for the test (~45–60 cm). Enter that number, then press Calibrate.
          </p>

          <form onSubmit={handleCalibrate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Approximate distance from screen (cm)
              </label>
              <input
                type="number"
                min={30}
                max={150}
                value={distanceCm}
                onChange={(e) => setDistanceCm(e.target.value)}
                className="w-full max-w-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Typical laptop use is around 45–60 cm.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <p className="uppercase tracking-wide text-[10px] text-slate-500 mb-1">
                  Eye distance (pixels)
                </p>
                <p className="font-semibold">
                  {ipdPixels ? ipdPixels.toFixed(1) : 'Detecting…'}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px] text-slate-500 mb-1">
                  Camera width (pixels)
                </p>
                <p className="font-semibold">{imageWidth || 'Detecting…'}</p>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-600"
            >
              {saving ? 'Saving…' : 'Calibrate'}
            </button>
            {success && (
              <button
                type="button"
                onClick={() => navigate(returnTo)}
                className="mt-2 w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                {returnTo === '/test' ? 'Continue to vision test' : 'Continue'}
              </button>
            )}
          </form>

          <p className="text-[11px] text-slate-500">
            Calibration is approximate and intended to improve screening quality. It does not
            replace a professional measurement in a clinical setting.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CalibrationPage;

