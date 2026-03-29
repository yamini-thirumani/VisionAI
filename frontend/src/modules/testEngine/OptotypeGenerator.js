/** Seven steps: coarse chart for self-screening (not a full clinical 20/20 ladder). */
export const SNELLEN_LEVELS = [
  '20/200',
  '20/100',
  '20/70',
  '20/50',
  '20/40',
  '20/30',
  '20/25'
];

/** Letters shown at each size before moving on. */
export const LETTERS_PER_SCREENING_LEVEL = 3;

/** Need at least this many correct at the current size to try the next smaller E. */
export const CORRECT_TO_PASS_LEVEL = 2;

const DIRECTIONS = ['right', 'left', 'up', 'down'];

class OptotypeGenerator {
  generateTest() {
    const tests = [];

    SNELLEN_LEVELS.forEach((level, levelIndex) => {
      for (let i = 0; i < LETTERS_PER_SCREENING_LEVEL; i += 1) {
        tests.push({
          level,
          levelIndex,
          letterIndex: i,
          totalLetters: LETTERS_PER_SCREENING_LEVEL,
          optotype: 'E',
          direction: DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
        });
      }
    });

    return tests;
  }

  calculateSize(snellenDenom, distance) {
    const getEffectiveDpi = () => {
      if (typeof document === 'undefined') return 96;
      const div = document.createElement('div');
      div.style.width = '1in';
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      document.body.appendChild(div);
      const cssPxPerInch = div.offsetWidth || 96;
      document.body.removeChild(div);
      const dpr =
        typeof window !== 'undefined' && window.devicePixelRatio
          ? window.devicePixelRatio
          : 1;
      // CSS "inches" are logical; many displays report ~96 CSS px/in while physical PPI is higher.
      // Scaling by 1/sqrt(dpr) reduces oversize optotypes on HiDPI screens when mapping mm → px.
      let dpi = cssPxPerInch / Math.sqrt(Math.max(1, dpr));
      try {
        const stored = parseFloat(
          localStorage.getItem('visionOptotypePxScale') || '1'
        );
        if (!Number.isNaN(stored) && stored > 0.25 && stored < 4) {
          dpi *= stored;
        }
      } catch (_) {
        /* ignore */
      }
      return dpi;
    };

    const visualAngle = (5 * snellenDenom) / 20;
    const sizeInMM = 2 * distance * 10 * Math.tan((visualAngle / 60) * (Math.PI / 180));
    const dpi = getEffectiveDpi();
    const sizeInPx = (sizeInMM * dpi) / 25.4;
    return Math.max(sizeInPx, 20);
  }
}

export default OptotypeGenerator;