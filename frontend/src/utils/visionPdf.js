import { jsPDF } from 'jspdf';

function recommendationForClassification(classification) {
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

const DISCLAIMER =
  'This is a preliminary screening tool and is NOT a substitute for a professional eye examination. If you have any concerns about your vision or eye health, please consult a qualified eye care professional.';

/** jsPDF: draw wrapped text line-by-line (avoids API quirks with string[] as first arg). */
function pdfMultiline(doc, text, x, yStart, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(String(text || ''), maxWidth);
  let y = yStart;
  for (let i = 0; i < lines.length; i += 1) {
    if (y > 278) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines[i], x, y);
    y += lineHeight;
  }
  return y;
}

function resolvePatientNameForPdf(test) {
  return (
    test?.user?.name ||
    (typeof test?.userId === 'object' && test.userId?.name) ||
    test?.patientName ||
    'Patient'
  );
}

/** How letter size / distance were anchored (saved on each test). */
export function labelDistanceCalibrationSource(src) {
  if (src === 'device_or_profile') {
    return 'Calibrated (this device or saved profile)';
  }
  if (src === 'session_opt_out') {
    return 'Approximate (calibration skipped this session)';
  }
  if (src === 'default_estimate') {
    return 'Default estimate (no calibration)';
  }
  return 'Not recorded';
}

function addDisclaimerBlock(doc, startY) {
  let y = startY;
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(11);
  doc.setTextColor(180, 30, 30);
  doc.text('Medical Disclaimer', 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  y = pdfMultiline(doc, DISCLAIMER, 20, y, 180, 4.2);
  return y + 4;
}

/**
 * Full single-test report: acuity, conditions, optional response rows.
 */
export function downloadIndividualTestPdf(test) {
  if (!test) return;

  const doc = new jsPDF();
  const patientName = resolvePatientNameForPdf(test);
  const createdAt = test.createdAt ? new Date(test.createdAt) : null;
  const dateStr = createdAt ? createdAt.toLocaleString() : '';
  const va = test.visualAcuity || {};
  const byEye = test.visualAcuityByEye || null;
  const conditions = test.testConditions || {};
  const pauses = conditions.violations || [];
  const totalPauseDuration = pauses.reduce(
    (sum, p) => sum + (p.durationSeconds || 0),
    0
  );
  const classification = test.classification || 'normal';
  const recommendation = recommendationForClassification(classification);

  doc.setFontSize(16);
  doc.text('VisionAI Screening Report', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Patient: ${patientName}`, 14, 32);
  if (dateStr) doc.text(`Date: ${dateStr}`, 14, 38);
  doc.text(`Test ID: ${test._id || 'n/a'}`, 14, 44);

  doc.setFontSize(12);
  doc.text('Visual Acuity', 14, 56);
  doc.setFontSize(10);
  doc.text(`Snellen: ${va.snellen || 'n/a'}`, 20, 62);
  doc.text(`LogMAR: ${va.logMAR ?? 'n/a'}`, 20, 68);
  doc.text(`Decimal: ${va.decimal ?? 'n/a'}`, 20, 74);
  if (byEye?.right?.snellen && byEye?.left?.snellen) {
    doc.setFontSize(9);
    doc.text(
      `Summary Snellen reflects the weaker eye. Right (OD): ${byEye.right.snellen} · Left (OS): ${byEye.left.snellen}`,
      20,
      80
    );
  }

  doc.setFontSize(12);
  doc.text('Classification', 110, 56);
  doc.setFontSize(10);
  doc.text(`Level: ${classification.replace(/-/g, ' ')}`, 116, 62);

  doc.setFontSize(12);
  doc.text('Test Conditions', 14, 94);
  doc.setFontSize(10);
  const distText =
    conditions.averageDistance != null
      ? `${conditions.averageDistance} cm`
      : 'n/a';
  const lightLevelText =
    conditions.lightingLevel != null ? `${conditions.lightingLevel}` : 'n/a';
  const lightingQuality =
    conditions.lightingQuality ||
    (conditions.lightingLevel != null ? 'ESTIMATED' : 'n/a');

  doc.text(`Average distance: ${distText}`, 20, 100);
  doc.text(
    `Letter sizing / distance: ${labelDistanceCalibrationSource(
      conditions.distanceCalibrationSource
    )}`,
    20,
    106
  );
  doc.text(`Lighting (mean brightness): ${lightLevelText}`, 20, 112);
  doc.text(`Lighting rating: ${lightingQuality}`, 20, 118);
  const durationText =
    test.testDuration != null ? `${test.testDuration}s` : 'n/a';
  doc.text(`Test duration: ${durationText}`, 20, 124);
  doc.text(
    `Pauses: ${pauses.length} (${totalPauseDuration}s total)`,
    20,
    130
  );
  let condExtraY = 136;
  if (conditions.glassesDetected === true) {
    doc.text('Glasses detected during test: yes', 20, condExtraY);
    condExtraY += 6;
  }
  if (conditions.testMode === 'monocular') {
    doc.text('Test mode: monocular (one eye at a time)', 20, condExtraY);
    condExtraY += 6;
  }

  const recTitleY = Math.max(156, condExtraY + 8);
  doc.setFontSize(12);
  doc.text('Recommendation', 14, recTitleY);
  doc.setFontSize(10);
  let yRec = pdfMultiline(doc, recommendation, 20, recTitleY + 6, 180, 5);

  let y = Math.max(recTitleY + 28, yRec + 8);
  const responses = Array.isArray(test.responses) ? test.responses : [];
  if (responses.length > 0) {
    doc.setFontSize(12);
    doc.text('Response detail (per trial)', 14, y);
    y += 8;
    doc.setFontSize(8);
    doc.text('Eye', 14, y);
    doc.text('Level', 34, y);
    doc.text('OK', 64, y);
    doc.text('Answer', 78, y);
    doc.text('s', 118, y);
    y += 5;

    const maxRows = 60;
    const slice = responses.slice(0, maxRows);
    for (let i = 0; i < slice.length; i += 1) {
      const r = slice[i];
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const ua = String(r.userResponse ?? '').slice(0, 10);
      const eyeShort = r.eye === 'left' ? 'L' : r.eye === 'right' ? 'R' : '·';
      doc.text(eyeShort, 14, y);
      doc.text(String(r.level ?? ''), 34, y);
      doc.text(r.correct ? 'Y' : 'N', 64, y);
      doc.text(ua, 78, y);
      doc.text(
        r.responseTime != null && Number.isFinite(Number(r.responseTime))
          ? Number(r.responseTime).toFixed(2)
          : 'n/a',
        118,
        y
      );
      y += 5;
    }
    if (responses.length > maxRows) {
      doc.text(
        `… ${responses.length - maxRows} more rows not shown (see app for full data).`,
        14,
        y
      );
      y += 8;
    }
    y += 6;
  }

  if (pauses.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.text('Pause / condition events', 14, y);
    y += 8;
    doc.setFontSize(9);
    for (let i = 0; i < pauses.length; i += 1) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const p = pauses[i];
      const line =
        (p.reason && String(p.reason).trim()) ||
        (p.type ? `${p.type} violation` : 'Condition violation');
      doc.text(`${line} (${p.durationSeconds ?? 0}s)`, 20, y);
      y += 5;
    }
    y += 4;
  }

  addDisclaimerBlock(doc, y);

  const safeId = String(test._id || 'report').replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`VisionAI_Report_${safeId}.pdf`);
}

/**
 * Multi-test summary table for history / longitudinal view.
 */
export function downloadSummaryPdf(tests, patientName = 'Patient') {
  if (!Array.isArray(tests) || tests.length === 0) return;

  const doc = new jsPDF();
  const sorted = [...tests].sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });

  doc.setFontSize(16);
  doc.text('VisionAI test summary', 105, 22, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Patient: ${patientName}`, 14, 34);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
  doc.text(`Tests included: ${sorted.length}`, 14, 46);

  let y = 58;
  doc.setFontSize(9);
  doc.text('Date', 14, y);
  doc.text('Snellen', 48, y);
  doc.text('LogMAR', 78, y);
  doc.text('Class.', 102, y);
  doc.text('Dist cm', 148, y);
  y += 6;

  for (let i = 0; i < sorted.length; i += 1) {
    const t = sorted[i];
    if (y > 285) {
      doc.addPage();
      y = 20;
    }
    const dt = t.createdAt
      ? new Date(t.createdAt).toLocaleString()
      : 'n/a';
    const sn = t.visualAcuity?.snellen ?? 'n/a';
    const lm = t.visualAcuity?.logMAR ?? 'n/a';
    const cl = (t.classification || 'n/a').replace(/-/g, ' ');
    const dist = t.testConditions?.averageDistance ?? 'n/a';

    const row = [
      doc.splitTextToSize(dt, 32)[0] || dt,
      doc.splitTextToSize(String(sn), 24)[0],
      String(lm),
      doc.splitTextToSize(cl, 40)[0],
      dist !== 'n/a' ? String(dist) : 'n/a'
    ];

    doc.text(row[0], 14, y);
    doc.text(row[1], 48, y);
    doc.text(row[2], 78, y);
    doc.text(row[3], 102, y);
    doc.text(row[4], 148, y);
    y += 7;
  }

  y += 8;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  addDisclaimerBlock(doc, y);

  doc.save(`VisionAI_Summary_${Date.now()}.pdf`);
}
