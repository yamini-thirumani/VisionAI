import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { testApi } from '../api/testApi';
import {
  downloadIndividualTestPdf,
  labelDistanceCalibrationSource
} from '../utils/visionPdf';
import { cell, NA } from '../utils/display';

function getClassificationTone(classification) {
  const map = {
    normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderline: 'bg-amber-50 text-amber-700 border-amber-200',
    'mild-myopia': 'bg-orange-50 text-orange-700 border-orange-200',
    'moderate-myopia': 'bg-red-50 text-red-700 border-red-200',
    'severe-myopia': 'bg-rose-50 text-rose-700 border-rose-200'
  };
  return map[classification] || map.normal;
}

function getRecommendation(classification) {
  switch (classification) {
    case 'normal':
      return 'Your vision appears normal. Continue regular eye care.';
    case 'borderline':
      return 'Consider monitoring your vision regularly.';
    case 'mild-myopia':
      return 'Consider consulting an eye care professional.';
    case 'moderate-myopia':
    case 'severe-myopia':
      return 'We strongly recommend scheduling a comprehensive eye examination soon.';
    default:
      return 'Consider consulting an eye care professional for a detailed evaluation.';
  }
}

const VIOLATION_TYPE_LABELS = {
  distance: 'Distance',
  lighting: 'Lighting',
  posture: 'Posture',
  movement: 'Movement'
};

function extractTestFromResponse(res) {
  const body = res?.data;
  if (!body || body.success === false) return null;
  const payload = body.data;
  if (!payload) return null;
  if (payload.test) return payload.test;
  if (payload._id && payload.visualAcuity) return payload;
  return null;
}

function formatViolationDescription(v) {
  if (v?.reason && String(v.reason).trim()) return String(v.reason).trim();
  const t = v?.type;
  const label = VIOLATION_TYPE_LABELS[t] || t || 'Condition';
  return `${label} violation`;
}

function resolvePatientName(test) {
  return (
    test?.user?.name ||
    (typeof test?.userId === 'object' && test.userId?.name) ||
    test?.patientName ||
    'Patient'
  );
}

function buildPauseEventLines(violations, reliabilityPauses) {
  const fromViolations = (violations || []).map((p, idx) => ({
    key: `v-${idx}`,
    text: `${formatViolationDescription(p)} (${p.durationSeconds ?? 0}s)`
  }));
  if (fromViolations.length > 0) return fromViolations;
  return (reliabilityPauses || []).map((p, idx) => ({
    key: `p-${idx}`,
    text: `${p.reason || 'Session pause'} (${p.durationSeconds ?? 0}s)`
  }));
}

function ResultsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!testId || !/^[0-9a-fA-F]{24}$/.test(testId)) {
        setError('This result link is invalid or incomplete.');
        setLoading(false);
        return;
      }
      try {
        const res = await testApi.getTest(testId);
        const payload = extractTestFromResponse(res);
        if (!payload) {
          setError(
            'The server response did not include test data. Check that the API URL is correct (VITE_API_URL) and you are logged in.'
          );
          return;
        }
        setTest(payload);
      } catch (err) {
        console.error('Error loading test result:', err);
        const status = err.response?.status;
        let msg = err.response?.data?.message;
        if (!err.response) {
          const base =
            import.meta.env.VITE_API_URL ||
            (import.meta.env.DEV ? 'http://localhost:5000/api' : '(not set)');
          msg = `Cannot reach the API (${base}). Start the backend, confirm the URL matches your .env, and try again.`;
        } else if (status === 401) {
          msg = 'Please sign in again to view this result.';
        } else if (status === 403) {
          msg = 'You do not have permission to view this test result.';
        } else if (status === 404) {
          msg = 'This test result was not found. It may have been deleted or the link is wrong.';
        }
        setError(
          msg ||
            err.message ||
            'Unable to load test result. It may have been removed.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testId]);

  if (loading) {
    return <div className="p-8">Loading result…</div>;
  }

  if (error || !test) {
    return (
      <div className="container mx-auto p-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-2">Could not load result</h1>
        <p className="text-red-700 mb-6 text-sm leading-relaxed">{error || 'Result not found.'}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/test"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Retake vision test
          </Link>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="bg-white border border-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-50"
          >
            Dashboard
          </button>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const patientName = resolvePatientName(test);
  const createdAt = test.createdAt ? new Date(test.createdAt) : null;
  const va = test.visualAcuity || {};
  const reliability = test.reliability || {};
  const conditions = test.testConditions || {};
  const pauses = conditions.violations || [];
  const pauseDurationFromViolations = pauses.reduce(
    (sum, p) => sum + (p.durationSeconds || 0),
    0
  );
  const pauseDurationFromReliability = (reliability.pauses || []).reduce(
    (sum, p) => sum + (p.durationSeconds || 0),
    0
  );
  const totalPauseDuration =
    pauses.length > 0 ? pauseDurationFromViolations : pauseDurationFromReliability;

  const classification = test.classification || 'normal';
  const recommendation = getRecommendation(classification);
  const byEye = test.visualAcuityByEye || null;

  const handleDownload = () => {
    try {
      setPdfError(null);
      downloadIndividualTestPdf(test);
    } catch (e) {
      console.error('PDF error:', e);
      setPdfError('Could not generate the PDF. Try again, or use your browser Print dialog.');
    }
  };

  const pauseEventLines = buildPauseEventLines(pauses, reliability.pauses);

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 mb-1">
        Vision test result
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {patientName}
        {createdAt && ` · ${createdAt.toLocaleString()}`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <h2 className="font-serif text-xl font-semibold text-slate-900 mb-4">Visual acuity</h2>
          {byEye?.right?.snellen && byEye?.left?.snellen && (
            <p className="text-xs text-gray-500 mb-3">
              Summary below uses the <strong>weaker eye</strong> (standard for screening). Per-eye
              scores are listed separately.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">
                Snellen {byEye?.right?.snellen ? '(worse eye)' : ''}
              </p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {cell(va.snellen)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">LogMAR</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {cell(va.logMAR)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Decimal</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {cell(va.decimal)}
              </p>
            </div>
          </div>

          {byEye?.right?.snellen && byEye?.left?.snellen && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs uppercase text-gray-500 mb-1">Right eye (OD)</p>
                <p className="text-xl font-bold">{byEye.right.snellen}</p>
                <p className="text-sm text-gray-600 mt-1 tabular-nums">
                  LogMAR {cell(byEye.right.logMAR)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs uppercase text-gray-500 mb-1">Left eye (OS)</p>
                <p className="text-xl font-bold">{byEye.left.snellen}</p>
                <p className="text-sm text-gray-600 mt-1 tabular-nums">
                  LogMAR {cell(byEye.left.logMAR)}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs uppercase text-gray-500 mb-1">Classification</p>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getClassificationTone(
                classification
              )}`}
            >
              {classification.replace('-', ' ')}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-1">Recommendation</h3>
            <p className="text-sm text-gray-700">{recommendation}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-4 border border-slate-100">
          <h2 className="font-serif text-xl font-semibold text-slate-900 mb-1">Test conditions</h2>
          <p className="text-xs text-slate-500 mb-4">
            Session notes (distance, lighting, pauses). Not a machine-learning model score.
          </p>
          {conditions.testMode && (
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Test mode</p>
              <p className="text-lg font-semibold capitalize">
                {conditions.testMode === 'monocular' ? 'One eye at a time' : 'Both eyes'}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Average Distance</p>
            <p className="text-lg font-semibold tabular-nums">
              {conditions.averageDistance != null ? `${conditions.averageDistance} cm` : NA}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Letter sizing</p>
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              {labelDistanceCalibrationSource(conditions.distanceCalibrationSource)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Snellen letters are sized from estimated viewing distance; calibration aligns that to
              your screen and seating.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Lighting</p>
            <p className="text-lg font-semibold">
              {(() => {
                if (conditions.lightingQuality) {
                  const map = {
                    OPTIMAL: 'Optimal',
                    TOO_DARK: 'Too dark',
                    TOO_BRIGHT: 'Too bright',
                    GLARE_DETECTED: 'Glare detected',
                    UNKNOWN: 'Unknown'
                  };
                  return map[conditions.lightingQuality] || conditions.lightingQuality;
                }
                if (conditions.lightingLevel != null) {
                  return `Level ${conditions.lightingLevel}`;
                }
                return NA;
              })()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Test Duration</p>
            <p className="text-lg font-semibold tabular-nums">
              {test.testDuration != null ? `${test.testDuration}s` : NA}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Pauses / interruptions</p>
            <p className="text-lg font-semibold">
              {pauseEventLines.length} event{pauseEventLines.length === 1 ? '' : 's'} (
              {totalPauseDuration}s total)
            </p>
          </div>

          {conditions.glassesDetected === true && (
            <div className="pt-2">
              <p className="text-sm font-semibold text-amber-700">
                Test taken with glasses.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Test Details</h2>
        <p className="text-sm text-gray-600 mb-4">
          This summary is from your recent vision screening. It includes your results across optotype
          levels, estimated viewing distance, lighting, and any pauses during the session.
        </p>
        {pauseEventLines.length > 0 && (
          <div className="mt-2">
            <p className="text-xs uppercase text-gray-500 mb-1">Condition events</p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {pauseEventLines.map((row) => (
                <li key={row.key}>{row.text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-md text-sm mb-6">
        <strong className="font-semibold">
          This is a preliminary screening tool only and is NOT a substitute for a
          professional eye examination.
        </strong>{' '}
        If you have any concerns about your vision or eye health, please consult a
        qualified eye care professional.
      </div>

      {pdfError && (
        <p className="text-sm text-red-600 mb-3" role="alert">
          {pdfError}
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleDownload}
          className="bg-white border border-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-50"
        >
          Download PDF report
        </button>
        <Link
          to="/test"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Retake test
        </Link>
        <Link
          to="/history"
          className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          View History
        </Link>
      </div>
    </div>
  );
}

export default ResultsPage;

