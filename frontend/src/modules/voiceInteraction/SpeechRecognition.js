class SpeechRecognitionService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) throw new Error('Speech Recognition not supported');
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.isListening = false;
  }

  startListening(onResult, onError) {
    let handled = false;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      onResult(transcript);
      handled = true;
      this.isListening = false;
    };

    this.recognition.onerror = (event) => {
      onError(event.error);
      handled = true;
      this.isListening = false;
    };

    // If recognition ends without a result or explicit error (e.g., very quiet
    // environment or the user didn't speak), treat it as a "no-speech" case so
    // the caller can gracefully fall back to manual input.
    this.recognition.onend = () => {
      if (!handled) {
        onError('no-speech');
      }
      this.isListening = false;
    };

    this.recognition.start();
    this.isListening = true;
  }

  stopListening() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export default SpeechRecognitionService;