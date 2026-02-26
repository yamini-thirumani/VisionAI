class SpeechSynthesisService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = this.synth.getVoices().find(v => v.lang === 'en-US') || this.synth.getVoices()[0];
  }

  speak(text) {
    return new Promise((resolve) => {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = resolve;
      this.synth.speak(utterance);
    });
  }

  cancel() {
    this.synth.cancel();
  }
}

export default SpeechSynthesisService;