/**
 * Distance calibration is stored per browser (localStorage) and optionally on the user profile (K).
 * "Done" means the user completed calibration on this device OR we synced K from their account.
 */

export const CALIB_K_KEY = 'visionai_calibration_K';
export const CALIB_DONE_KEY = 'visionai_calibration_done';
export const SKIP_SESSION_KEY = 'visionai_skip_calibration_warned';

export function readStoredCalibrationK() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CALIB_K_KEY);
  const v = parseFloat(raw);
  return Number.isFinite(v) && v > 0 ? v : null;
}

/** Copy profile K to this device and mark calibration as done for gating. */
export function applyCalibrationFromUser(user) {
  if (typeof window === 'undefined') return null;
  const k = user?.calibration?.K;
  if (k == null || !Number.isFinite(Number(k)) || Number(k) <= 0) return null;
  const num = Number(k);
  localStorage.setItem(CALIB_K_KEY, String(num));
  localStorage.setItem(CALIB_DONE_KEY, '1');
  return num;
}

export function markCalibrationCompleteOnDevice() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CALIB_DONE_KEY, '1');
}

export function hasCalibrationForSession() {
  if (typeof window === 'undefined') return true;
  if (sessionStorage.getItem(SKIP_SESSION_KEY) === '1') return true;
  if (localStorage.getItem(CALIB_DONE_KEY) === '1') return true;
  return false;
}

export function acknowledgeApproximateResultsThisSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SKIP_SESSION_KEY, '1');
}

/** For saving on each test — how distance / letter sizing was anchored. */
export function getCalibrationSourceForPayload() {
  if (typeof window === 'undefined') return 'default_estimate';
  if (localStorage.getItem(CALIB_DONE_KEY) === '1') return 'device_or_profile';
  if (sessionStorage.getItem(SKIP_SESSION_KEY) === '1') return 'session_opt_out';
  return 'default_estimate';
}
