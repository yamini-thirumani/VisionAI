class ScoreCalculator {
  calculateScore(responses, lastPassedLevel = null) {
    const correctResponses = responses.filter(r => r.correct);
    let smallestCorrect;

    if (lastPassedLevel) {
      smallestCorrect = lastPassedLevel;
    } else if (correctResponses.length > 0) {
      smallestCorrect = correctResponses[correctResponses.length - 1].level;
    } else {
      smallestCorrect = '20/200';
    }

    const denominator = parseInt(smallestCorrect.split('/')[1]);
    const logMAR = Math.log10(denominator / 20);
    const accuracy = (correctResponses.length / responses.length) * 100;

    let classification = 'severe-myopia';
    if (denominator <= 20) classification = 'normal';
    else if (denominator <= 30) classification = 'borderline';
    else if (denominator <= 70) classification = 'mild-myopia';
    else if (denominator <= 160) classification = 'moderate-myopia';

    return {
      snellen: smallestCorrect,
      logMAR: parseFloat(logMAR.toFixed(2)),
      decimal: parseFloat((20 / denominator).toFixed(2)),
      accuracyPercentage: Math.round(accuracy),
      classification
    };
  }

  /**
   * Higher Snellen denominator = worse acuity. Used to pick the eye that drives screening classification.
   */
  pickWorseVisualAcuity(vaA, vaB) {
    if (!vaA || !vaA.snellen) return vaB;
    if (!vaB || !vaB.snellen) return vaA;
    const da = parseInt(vaA.snellen.split('/')[1], 10);
    const db = parseInt(vaB.snellen.split('/')[1], 10);
    return da >= db ? vaA : vaB;
  }
}

export default ScoreCalculator;