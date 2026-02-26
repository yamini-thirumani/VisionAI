import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { testApi } from '../api/testApi';

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

function ResultsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await testApi.getTest(testId);
        setTest(res.data.data.test);
      } catch (err) {
        console.error('Error loading test result:', err);
        setError('Unable to load test result. It may have been removed.');
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
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Test Result</h1>
        <p className="text-red-600 mb-6">{error || 'Result not found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const patientName = test.user?.name || test.patientName || 'Patient';
  const createdAt = test.createdAt ? new Date(test.createdAt) : null;
  const va = test.visualAcuity || {};
  const reliability = test.reliability || {};
  const conditions = test.testConditions || {};
  const pauses = reliability.pauses || conditions.violations || [];
  const totalPauseDuration = pauses.reduce(
    (sum, p) => sum + (p.durationSeconds || 0),
    0
  );

  const classification = test.classification || 'normal';
  const recommendation = getRecommendation(classification);

  const handleDownload = () => {
    const doc = new jsPDF();

    const title = 'VisionAI Screening Report';
    doc.setFontSize(16);
    doc.text(title, 105, 20, { align: 'center' });

    doc.setFontSize(10);
    const dateStr = createdAt ? createdAt.toLocaleString() : '';
    doc.text(`Patient: ${patientName}`, 14, 32);
    if (dateStr) {
      doc.text(`Date: ${dateStr}`, 14, 38);
    }

    // Visual acuity block
    doc.setFontSize(12);
    doc.text('Visual Acuity', 14, 50);
    doc.setFontSize(10);
    doc.text(`Snellen: ${va.snellen || '-'}`, 20, 56);
    doc.text(`LogMAR: ${va.logMAR ?? '-'}`, 20, 62);
    doc.text(`Decimal: ${va.decimal ?? '-'}`, 20, 68);
    const accText =
      va.accuracyPercentage != null ? `${va.accuracyPercentage}%` : '-';
    doc.text(`Accuracy: ${accText}`, 20, 74);

    // Classification
    doc.setFontSize(12);
    doc.text('Classification', 110, 50);
    doc.setFontSize(10);
    doc.text(
      `Level: ${classification.replace('-', ' ')}`,
      116,
      56
    );
    doc.text(`Reliability: ${reliability.confidenceScore ?? '-'}%`, 116, 62);

    // Conditions
    doc.setFontSize(12);
    doc.text('Test Conditions', 14, 90);
    doc.setFontSize(10);
    const distText =
      conditions.averageDistance != null
        ? `${conditions.averageDistance} cm`
        : '-';
    const lightLevelText =
      conditions.lightingLevel != null
        ? `${conditions.lightingLevel}`
        : '-';
    const lightingQuality =
      conditions.lightingQuality ||
      (conditions.lightingLevel != null ? 'ESTIMATED' : '-');

    doc.text(`Average distance: ${distText}`, 20, 96);
    doc.text(`Lighting (mean brightness): ${lightLevelText}`, 20, 102);
    doc.text(`Lighting rating: ${lightingQuality}`, 20, 108);
    const postureText =
      reliability.consistencyScore != null
        ? `${Math.round(reliability.consistencyScore * 100)}%`
        : '-';
    doc.text(`Posture stability: ${postureText}`, 20, 114);
    const durationText =
      test.testDuration != null ? `${test.testDuration}s` : '-';
    doc.text(`Test duration: ${durationText}`, 20, 120);

    // Recommendation + disclaimer
    doc.setFontSize(12);
    doc.text('Recommendation', 14, 138);
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(recommendation, 180), 20, 144);

    const disclaimer =
      'This is a preliminary screening tool and is NOT a substitute for a professional eye examination. If you have any concerns about your vision or eye health, please consult a qualified eye care professional.';
    doc.setFontSize(11);
    doc.setTextColor(180, 30, 30);
    doc.text('Medical Disclaimer', 14, 172);
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(disclaimer, 180), 20, 178);

    doc.save(`VisionAI_Report_${test._id}.pdf`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-1">Vision Test Result</h1>
      <p className="text-sm text-gray-500 mb-6">
        {patientName}
        {createdAt && ` · ${createdAt.toLocaleString()}`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <h2 className="text-xl font-semibold mb-4">Visual Acuity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Snellen</p>
              <p className="text-2xl font-bold">{va.snellen || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">LogMAR</p>
              <p className="text-2xl font-bold">{va.logMAR ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Decimal</p>
              <p className="text-2xl font-bold">{va.decimal ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Accuracy</p>
              <p className="text-2xl font-bold">
                {va.accuracyPercentage != null ? `${va.accuracyPercentage}%` : '—'}
              </p>
            </div>
          </div>

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

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Test Quality</h2>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Reliability</p>
            <p className="text-2xl font-bold">
              {reliability.confidenceScore != null
                ? `${reliability.confidenceScore}%`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Average Distance</p>
            <p className="text-lg font-semibold">
              {conditions.averageDistance != null
                ? `${conditions.averageDistance} cm`
                : '—'}
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
                return '—';
              })()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Posture Stability</p>
            <p className="text-lg font-semibold">
              {reliability.consistencyScore != null
                ? `${Math.round(reliability.consistencyScore * 100)}%`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Test Duration</p>
            <p className="text-lg font-semibold">
              {test.testDuration != null ? `${test.testDuration}s` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-1">Pauses</p>
            <p className="text-lg font-semibold">
              {pauses.length} pause{pauses.length === 1 ? '' : 's'} (
              {totalPauseDuration}s total)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Test Details</h2>
        <p className="text-sm text-gray-600 mb-4">
          This summary is based on your recent AI-assisted vision screening. It includes
          your performance across optotype levels, estimated distance, lighting, and
          observed stability during the test.
        </p>
        {pauses.length > 0 && (
          <div className="mt-2">
            <p className="text-xs uppercase text-gray-500 mb-1">Pause Events</p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {pauses.map((p, idx) => (
                <li key={idx}>
                  {p.reason || 'Condition violation'} — {p.durationSeconds || 0}s
                </li>
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

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleDownload}
          className="bg-white border border-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-50"
        >
          Download Report
        </button>
        <Link
          to="/test"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Retake Test
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

