const SNELLEN_LEVELS = ['20/200', '20/150', '20/100', '20/70', '20/50', '20/40', '20/30', '20/25', '20/20'];
const LETTERS = ['C', 'D', 'E', 'F', 'L', 'O', 'P', 'T', 'Z'];

class OptotypeGenerator {
  generateTest() {
    const tests = [];

    SNELLEN_LEVELS.forEach((level, levelIndex) => {
      for (let i = 0; i < 5; i += 1) {
        tests.push({
          level,
          levelIndex,
          letterIndex: i,
          totalLetters: 5,
          optotype: LETTERS[Math.floor(Math.random() * LETTERS.length)]
        });
      }
    });

    return tests;
  }

  calculateSize(snellenDenom, distance) {
    const getScreenDPI = () => {
      if (typeof document === 'undefined') return 96;
      const div = document.createElement('div');
      div.style.width = '1in';
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      document.body.appendChild(div);
      const dpi = div.offsetWidth || 96;
      document.body.removeChild(div);
      return dpi;
    };

    const visualAngle = (5 * snellenDenom) / 20;
    const sizeInMM = 2 * distance * 10 * Math.tan((visualAngle / 60) * (Math.PI / 180));
    const dpi = getScreenDPI();
    const sizeInPx = (sizeInMM * dpi) / 25.4;
    return Math.max(sizeInPx, 20);
  }
}

export default OptotypeGenerator;