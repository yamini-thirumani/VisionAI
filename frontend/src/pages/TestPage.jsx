// function TestPage() {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const videoRef = useRef(null);
  
//   const [stage, setStage] = useState('setup'); // setup, calibration, testing, complete
//   const [currentTest, setCurrentTest] = useState(0);
//   const [testItems, setTestItems] = useState([]);
//   const [responses, setResponses] = useState([]);
//   const [distance, setDistance] = useState(0);
//   const [posture, setPosture] = useState(null);
//   const [message, setMessage] = useState('Initializing...');
//   const [currentOptotype, setCurrentOptotype] = useState('');
  
//   const faceDetection = useRef(null);
//   const distanceCalc = useRef(new DistanceCalculator());
//   const postureMonitor = useRef(new PostureMonitor());
//   const speechRecognition = useRef(null);
//   const speechSynthesis = useRef(new SpeechSynthesisService());
//   const optotypeGen = useRef(new OptotypeGenerator());
//   const scoreCalc = useRef(new ScoreCalculator());

//   useEffect(() => {
//     initializeTest();
//     return () => {
//       if (faceDetection.current) {
//         faceDetection.current.stop();
//       }
//     };
//   }, []);

//   const initializeTest = async () => {
//     try {
//       faceDetection.current = new FaceDetection();
//       speechRecognition.current = new SpeechRecognitionService();
      
//       await faceDetection.current.initialize(videoRef.current, handleFaceResults);
      
//       const tests = optotypeGen.current.generateTest();
//       setTestItems(tests);
      
//       setStage('calibration');
//       setMessage('Position yourself 50cm from screen');
//       await speechSynthesis.current.speak('Please position yourself 50 centimeters from the screen');
//     } catch (error) {
//       console.error('Initialization error:', error);
//       setMessage('Error: ' + error.message);
//     }
//   };

//   const handleFaceResults = (results) => {
//     if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
//       setMessage('No face detected');
//       return;
//     }

//     const landmarks = results.multiFaceLandmarks[0];
//     const dist = distanceCalc.current.calculateDistance(landmarks, results.image.width);
//     const pose = postureMonitor.current.calculateHeadPose(landmarks);
    
//     setDistance(dist);
//     setPosture(pose);

//     if (stage === 'calibration') {
//       const distValidation = distanceCalc.current.validateDistance(dist);
//       const postureValidation = postureMonitor.current.validatePosture(pose);
      
//       if (distValidation.isValid && postureValidation.isValid) {
//         setMessage('Perfect! Click Start Test');
//       } else {
//         setMessage(distValidation.message || postureValidation.message);
//       }
//     }
//   };

//   const startTest = async () => {
//     setStage('testing');
//     setCurrentTest(0);
//     showNextOptotype(0);
//   };

//   const showNextOptotype = async (index) => {
//     if (index >= testItems.length) {
//       completeTest();
//       return;
//     }

//     const item = testItems[index];
//     setCurrentOptotype(item.optotype);
//     setCurrentTest(index);
    
//     await speechSynthesis.current.speak(`What letter do you see?`);
    
//     speechRecognition.current.startListening(
//       (transcript) => handleVoiceResponse(transcript, item),
//       (error) => console.error('Speech error:', error)
//     );
//   };

//   const handleVoiceResponse = (transcript, item) => {
//     const userAnswer = transcript.toUpperCase().charAt(0);
//     const correct = userAnswer === item.optotype;
    
//     const response = {
//       level: item.level,
//       optotype: item.optotype,
//       userResponse: userAnswer,
//       correct,
//       responseTime: 2000,
//       distance
//     };
    
//     setResponses(prev => [...prev, response]);
    
//     setTimeout(() => {
//       showNextOptotype(currentTest + 1);
//     }, 500);
//   };

//   const completeTest = async () => {
//     setStage('complete');
//     setMessage('Test complete! Calculating results...');
    
//     const visualAcuity = scoreCalc.current.calculateScore(responses);
    
//     const testData = {
//         visualAcuity,
//         classification: visualAcuity.classification,
//         testConditions: {
//             averageDistance: Math.round(responses.reduce((sum, r) => sum + r.distance, 0) / responses.length),
//             lightingLevel: 100,
//             violations: []
//         },
//         reliability: {
//             confidenceScore: 85,
//             consistencyScore: 0.9,
//             averageResponseTime: 2.5
//         },
//         responses,
//         testDuration: 180
//     };
//     try {
//   await testApi.createTest(testData);
//   await speechSynthesis.current.speak('Test complete. Redirecting to results.');
//   setTimeout(() => navigate('/dashboard'), 2000);
// } catch (error) {
//   console.error('Error saving test:', error);
//   setMessage('Error saving results');
// }
//   };
//   return (
// <div className="container mx-auto p-8">
// <h1 className="text-3xl font-bold mb-8">Vision Test</h1>
// <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//     <div>
//       <video
//         ref={videoRef}
//         className="w-full rounded-lg shadow-lg"
//         autoPlay
//         playsInline
//       />
      
//       <div className="mt-4 p-4 bg-white rounded-lg shadow">
//         <p className="text-sm text-gray-600">Distance: {distance}cm</p>
//         {posture && (
//           <p className="text-sm text-gray-600">
//             Posture: Yaw {posture.yaw}° Roll {posture.roll}°
//           </p>
//         )}
//       </div>
//     </div>

//     <div className="flex flex-col justify-center items-center">
//       {stage === 'setup' && (
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
//           <p className="text-xl">{message}</p>
//         </div>
//       )}

//       {stage === 'calibration' && (
//         <div className="text-center">
//           <p className="text-xl mb-4">{message}</p>
//           <button
//             onClick={startTest}
//             className="bg-blue-600 text-white px-8 py-3 rounded-lg text-xl hover:bg-blue-700"
//           >
//             Start Test
//           </button>
//         </div>
//       )}

//       {stage === 'testing' && (
//         <div className="text-center">
//           <div 
//             className="text-9xl font-bold mb-8"
//             style={{ fontSize: `${optotypeGen.current.calculateSize(parseInt(testItems[currentTest].level.split('/')[1]), distance)}px` }}
//           >
//             {currentOptotype}
//           </div>
//           <p className="text-xl text-gray-600">
//             Test {currentTest + 1} of {testItems.length}
//           </p>
//           <p className="text-sm text-gray-500 mt-2">Speak the letter you see</p>
//         </div>
//       )}

//       {stage === 'complete' && (
//         <div className="text-center">
//           <div className="text-6xl mb-4">✓</div>
//           <p className="text-2xl font-bold">{message}</p>
//         </div>
//       )}
//     </div>
//   </div>
// </div>
//   );
// }
// export default TestPage;

import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { testApi } from '../api/testApi';
import FaceDetection, { detectGlasses } from '../modules/computerVision/FaceDetection';
import DistanceCalculator from '../modules/computerVision/DistanceCalculator';
import PostureMonitor from '../modules/computerVision/PosterMonitor';
import SpeechRecognitionService from '../modules/voiceInteraction/SpeechRecognition';
import SpeechSynthesisService from '../modules/voiceInteraction/SpeechSynthesis';
import OptotypeGenerator, {
  LETTERS_PER_SCREENING_LEVEL,
  CORRECT_TO_PASS_LEVEL
} from '../modules/testEngine/OptotypeGenerator';
import ScoreCalculator from '../modules/testEngine/ScoreCalculator';
import {
  HiOutlineVideoCamera,
  HiOutlineArrowsPointingOut,
  HiOutlineSun,
  HiOutlineHandRaised,
  HiOutlineArrowsRightLeft,
  HiOutlineEye
} from 'react-icons/hi2';
import {
  hasCalibrationForSession,
  applyCalibrationFromUser,
  acknowledgeApproximateResultsThisSession,
  getCalibrationSourceForPayload,
  readStoredCalibrationK
} from '../utils/calibration';

function VisualTestSteps() {
  const steps = [
    { Icon: HiOutlineVideoCamera, text: 'Allow camera' },
    { Icon: HiOutlineArrowsPointingOut, text: 'Arm’s length (~50 cm)' },
    { Icon: HiOutlineSun, text: 'Bright, no glare' },
    { Icon: HiOutlineHandRaised, text: 'Cover other eye when asked' },
    { Icon: HiOutlineArrowsRightLeft, text: 'E rotates: say where the gap opens' }
  ];
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-6"
      aria-label="Quick test steps"
    >
      {steps.map(({ Icon, text }, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center shadow-sm"
        >
          <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 shrink-0" aria-hidden />
          <span className="text-[10px] sm:text-xs font-medium text-slate-700 leading-tight">
            {text}
          </span>
        </div>
      ))}
    </div>
  );
}

function TestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Core test state
  const [stage, setStage] = useState('setup'); // setup, calibration_gate, calibration, eye_prep_right, eye_prep_left, testing, paused, complete
  const [skipApproxAck, setSkipApproxAck] = useState(false);
  const [testSessionId, setTestSessionId] = useState(null);
  const [testItems, setTestItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEye, setCurrentEye] = useState('right'); // OD / OS monocular flow
  const [currentOptotype, setCurrentOptotype] = useState('');
  const [responses, setResponses] = useState([]);
  const [visualResult, setVisualResult] = useState(null);
  const [reliabilitySummary, setReliabilitySummary] = useState(null);
  const LETTERS_PER_LEVEL = LETTERS_PER_SCREENING_LEVEL;

  // Environment and guidance
  const [distance, setDistance] = useState(null);
  const [posture, setPosture] = useState(null);
  const [distanceStatus, setDistanceStatus] = useState(null);
  const [postureStatus, setPostureStatus] = useState(null);
  const [lightingStatus, setLightingStatus] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [message, setMessage] = useState('Initializing camera and sensors...');
  const [initializationError, setInitializationError] = useState(null);
  const [showGlassesWarning, setShowGlassesWarning] = useState(false);

  // Glases warning is shown only once per test session (not per frame).
  const glassesWarningShownRef = useRef(false);
  const glassesDetectedRef = useRef(false);

  // Voice + input
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [pauseReason, setPauseReason] = useState(null);
  const [resumeCountdown, setResumeCountdown] = useState(null);

  // Timing
  const questionStartRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const activePromptIdRef = useRef(0);
  const lastPassedLevelRef = useRef(null);
  const responsesRef = useRef([]);
  const currentEyeRef = useRef('right');
  const visualAcuityByEyeRef = useRef({ right: null, left: null });
  const violationStartRef = useRef(null);
  const violationReasonRef = useRef(null);
  const pauseStartRef = useRef(null);
  const pauseEventsRef = useRef([]);
  const resumeIntervalRef = useRef(null);

  const normalizeDirectionInput = (input) => {
    const map = {
      right: 'right',
      left: 'left',
      up: 'up',
      down: 'down',
      r: 'right',
      l: 'left',
      u: 'up',
      d: 'down',
      '->': 'right',
      '=>': 'right',
      '←': 'left',
      '→': 'right',
      '↑': 'up',
      '↓': 'down'
    };
    const clean = (input || '').toLowerCase().trim();
    return map[clean] || null;
  };

  // Analyze lighting directly from the live camera element.
  // We intentionally ignore the MediaPipe image buffer and always
  // read from `videoRef.current` to avoid shape/compat issues and
  // to ensure we have a real HTMLVideoElement with dimensions.
  const analyzeLighting = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 160;
    const height = Math.round((video.videoHeight / video.videoWidth) * width);
    canvas.width = width;
    canvas.height = height;

    try {
      ctx.drawImage(video, 0, 0, width, height);
    } catch (e) {
      return null;
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const totalPixels = width * height;

    let sumBrightness = 0;
    let overexposedCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sumBrightness += brightness;
      if (brightness > 240) {
        overexposedCount += 1;
      }
    }

    const mean = sumBrightness / totalPixels;
    const glareRatio = overexposedCount / totalPixels;

    if (mean < 50) {
      return { status: 'too-dark', quality: 'TOO_DARK', mean, glareRatio, message: 'Lighting is too dark. Increase room lighting.' };
    }
    if (mean > 200) {
      return { status: 'too-bright', quality: 'TOO_BRIGHT', mean, glareRatio, message: 'Lighting is too bright. Reduce glare or brightness.' };
    }
    if (glareRatio > 0.05) {
      return { status: 'glare', quality: 'GLARE_DETECTED', mean, glareRatio, message: 'Glare detected on the screen. Adjust your position or lighting.' };
    }

    return { status: 'optimal', quality: 'OPTIMAL', mean, glareRatio, message: 'Lighting looks good.' };
  };

  // Services (kept stable via refs)
  const faceDetection = useRef(null);
  const distanceCalc = useRef(new DistanceCalculator());
  const postureMonitor = useRef(new PostureMonitor());
  const speechRecognition = useRef(null);
  const speechSynthesis = useRef(null);
  const optotypeGen = useRef(new OptotypeGenerator());
  const scoreCalc = useRef(new ScoreCalculator());

  useEffect(() => {
    let isMounted = true;

    const initializeTest = async () => {
      try {
        faceDetection.current = new FaceDetection();
        speechSynthesis.current = new SpeechSynthesisService();

        // Try to enable speech recognition; gracefully degrade if unsupported
        try {
          speechRecognition.current = new SpeechRecognitionService();
          setVoiceSupported(true);
        } catch (err) {
          console.warn('Speech recognition not supported, falling back to manual input:', err);
          setVoiceSupported(false);
        }

        await faceDetection.current.initialize(videoRef.current, handleFaceResults);

        const tests = optotypeGen.current.generateTest();
        if (!isMounted) return;

        applyCalibrationFromUser(user);
        const kLs = readStoredCalibrationK();
        if (kLs != null && distanceCalc.current) {
          distanceCalc.current.setCalibrationFactor(kLs);
        }

        setTestItems(tests);
        const canPosition = hasCalibrationForSession();
        setStage(canPosition ? 'calibration' : 'calibration_gate');
        if (canPosition) {
          setMessage('Please sit about 50 cm from the screen and look straight at the camera.');
          if (speechSynthesis.current) {
            await speechSynthesis.current.speak(
              'Please sit about fifty centimeters from the screen and look straight at the camera.'
            );
          }
        } else {
          setMessage('');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (!isMounted) return;
        setInitializationError(error.message || 'Unable to start advanced test on this device.');
        setMessage('Unable to start the advanced vision test. Please check camera permissions and refresh.');
        setStage('setup');
      }
    };

    initializeTest();

    return () => {
      isMounted = false;
      if (faceDetection.current) {
        faceDetection.current.stop();
      }
      if (speechRecognition.current) {
        speechRecognition.current.stopListening();
      }
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFaceResults = (results) => {
    const hasFace = !!(results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0);
    setFaceDetected(hasFace);

    const lighting = analyzeLighting();
    if (lighting) {
      setLightingStatus(lighting);
    }

    // IMPORTANT: use these local, freshly computed values for logic decisions
    // inside this callback (React state updates are async and may be stale).
    let distValidation = null;
    let postureValidation = null;

    if (!hasFace) {
      setPosture(null);
      setDistance(null);
      if (stage !== 'setup' && stage !== 'calibration_gate') {
        setMessage('Face not detected. Please sit facing the screen.');
      }
    }

    let dist = distance;
    let pose = posture;

    if (hasFace) {
      const landmarks = results.multiFaceLandmarks[0];
      const imageWidth = results.image?.width || videoRef.current?.videoWidth || 1280;

      // Glasses detection (end-user warning + payload flag).
      const glasses = detectGlasses(landmarks);
      if (
        !glassesWarningShownRef.current &&
        glasses?.detected === true &&
        glasses?.confidence > 0.6
      ) {
        glassesWarningShownRef.current = true;
        glassesDetectedRef.current = true;
        setShowGlassesWarning(true);
      }

      dist = distanceCalc.current.calculateDistance(landmarks, imageWidth);
      pose = postureMonitor.current.calculateHeadPose(landmarks);

      if (dist != null) {
        distValidation = distanceCalc.current.validateDistance(dist);
        setDistance(dist);
        setDistanceStatus(distValidation);
      }

      if (pose) {
        postureValidation = postureMonitor.current.validatePosture(pose);
        setPosture(pose);
        setPostureStatus(postureValidation);
      }
    }

    if (stage === 'calibration' && dist != null && pose) {
      const distValidationLocal = distValidation || distanceCalc.current.validateDistance(dist);
      const postureValidationLocal = postureValidation || postureMonitor.current.validatePosture(pose);

      if (distValidationLocal.isValid && postureValidationLocal.isValid && lighting?.status === 'optimal' && hasFace) {
        setMessage('Perfect position. When you are ready, start the test.');
      } else {
        setMessage(
          distValidationLocal.message ||
            postureValidationLocal.message ||
            lighting?.message ||
            'Adjust your position and lighting.'
        );
      }
    }

    const conditionsOk =
      hasFace &&
      dist != null &&
      pose &&
      distValidation?.isValid &&
      postureValidation?.isValid &&
      lighting?.status === 'optimal';

    let failureReason = null;
    if (!hasFace) failureReason = 'Face not detected';
    else if (!lighting || lighting.status !== 'optimal') failureReason = lighting?.message || 'Lighting not optimal';
    else if (!distValidation?.isValid) failureReason = distValidation?.message || 'Distance out of range';
    else if (!postureValidation?.isValid) failureReason = postureValidation?.message || 'Posture not stable';

    // Mid-test pause handling
    if (stage === 'testing') {
      if (!conditionsOk && failureReason) {
        if (!violationStartRef.current || violationReasonRef.current !== failureReason) {
          violationStartRef.current = Date.now();
          violationReasonRef.current = failureReason;
        } else if (Date.now() - violationStartRef.current >= 2000) {
          // Pause the test after >2s of continuous violation
          setStage('paused');
          setPauseReason(failureReason);
          setMessage(failureReason);
          pauseStartRef.current = Date.now();

          // Clear timers and stop listening
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current);
            responseTimeoutRef.current = null;
          }
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setTimeLeft(null);
          activePromptIdRef.current += 1;
          if (speechRecognition.current) {
            speechRecognition.current.stopListening();
          }
          if (speechSynthesis.current) {
            speechSynthesis.current.cancel();
          }
        }
      } else {
        violationStartRef.current = null;
        violationReasonRef.current = null;
      }
    }

    // Resume handling when paused
    if (stage === 'paused') {
      if (conditionsOk) {
        if (!resumeCountdown) {
          setResumeCountdown(3);
          if (speechSynthesis.current) {
            speechSynthesis.current.speak('Conditions are good again. Resuming in 3, 2, 1.');
          }

          if (resumeIntervalRef.current) {
            clearInterval(resumeIntervalRef.current);
          }
          resumeIntervalRef.current = setInterval(() => {
            setResumeCountdown((prev) => {
              if (prev === null) return prev;
              if (prev <= 1) {
                clearInterval(resumeIntervalRef.current);
                resumeIntervalRef.current = null;

                // Log pause event
                if (pauseStartRef.current) {
                  const durationMs = Date.now() - pauseStartRef.current;
                  pauseEventsRef.current.push({
                    reason: pauseReason || 'Condition violation',
                    durationSeconds: Math.round(durationMs / 1000)
                  });
                  pauseStartRef.current = null;
                }

                setStage('testing');
                setResumeCountdown(null);
                presentNextOptotype(currentIndex);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        // Conditions not yet good – ensure we show latest reason and stop any resume countdown
        if (failureReason) {
          setPauseReason(failureReason);
          setMessage(failureReason);
        }
        if (resumeIntervalRef.current) {
          clearInterval(resumeIntervalRef.current);
          resumeIntervalRef.current = null;
        }
        if (resumeCountdown !== null) {
          setResumeCountdown(null);
        }
      }
    }
  };

  const canStartTest = () => {
    const lightingOk = lightingStatus && lightingStatus.status === 'optimal';
    return Boolean(
      testItems.length &&
      distanceStatus &&
      postureStatus &&
      lightingStatus &&
      faceDetected &&
      distanceStatus.isValid &&
      postureStatus.isValid &&
      lightingOk
    );
  };

  const handleStartTest = async () => {
    if (!canStartTest()) return;
    // Start a completely fresh test session (monocular: right eye then left eye)
    const freshSessionId = Date.now().toString();
    const freshItems = optotypeGen.current.generateTest();

    setTestSessionId(freshSessionId);
    setTestItems(freshItems);
    setCurrentIndex(0);
    setCurrentOptotype('');
    setResponses([]);
    responsesRef.current = [];
    setVisualResult(null);
    setReliabilitySummary(null);
    setMessage('');
    lastPassedLevelRef.current = null;
    visualAcuityByEyeRef.current = { right: null, left: null };
    currentEyeRef.current = 'right';
    setCurrentEye('right');
    violationStartRef.current = null;
    violationReasonRef.current = null;
    pauseStartRef.current = null;
    pauseEventsRef.current = [];
    glassesWarningShownRef.current = false;
    glassesDetectedRef.current = false;
    setShowGlassesWarning(false);

    setStage('eye_prep_right');
    setMessage(
      'Next we test each eye separately: first your right eye, then your left.'
    );
    if (speechSynthesis.current) {
      await speechSynthesis.current.speak(
        'Next we will test each eye separately. First cover your left eye so you only see with your right eye. Use your hand or a tissue. When you are ready, press continue.'
      );
    }
  };

  const canBeginEyeSession = () => canStartTest();

  const handleBeginEyeSession = async (eye) => {
    if (!canBeginEyeSession()) return;
    currentEyeRef.current = eye;
    setCurrentEye(eye);
    lastPassedLevelRef.current = null;
    setCurrentIndex(0);
    setCurrentOptotype('');
    if (eye === 'right') {
      setResponses([]);
      responsesRef.current = [];
    }
    setStage('testing');
    await presentNextOptotype(0, testItems);
  };

  const presentNextOptotype = async (index, items = testItems) => {
    // Clear any previous timers when moving to the next optotype
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setTimeLeft(null);

    if (index >= items.length) {
      onEyeSessionComplete(responsesRef.current, lastPassedLevelRef.current);
      return;
    }

    const promptId = activePromptIdRef.current + 1;
    activePromptIdRef.current = promptId;

    const item = items[index];
    setCurrentOptotype(item.optotype);
    setCurrentIndex(index);
    questionStartRef.current = Date.now();

    const promptText = voiceSupported
      ? 'The E is rotated. Say which way the gap opens: right, left, up, or down.'
      : 'The E is rotated. Type which way the gap opens: right, left, up, or down.';

    if (speechSynthesis.current) {
      await speechSynthesis.current.speak(promptText);
    }

    if (voiceSupported && speechRecognition.current) {
      // Delay recognition start slightly so TTS does not bleed into ASR
      setTimeout(() => {
        // If a new prompt has started, abort starting recognition
        if (promptId !== activePromptIdRef.current) return;

        setIsListening(true);
        speechRecognition.current.startListening(
          (transcript) => {
            setIsListening(false);
            // Ignore late responses from previous prompts
            if (promptId !== activePromptIdRef.current) return;
            handleVoiceResponse(transcript, item);
          },
          (error) => {
            console.error('Speech recognition error:', error);
            setIsListening(false);
            setMessage('I could not hear you clearly. You can type your answer below.');
            // Degrade gracefully to manual input for the rest of the test
            setVoiceSupported(false);
          }
        );
      }, 500);
    }

    // Start 5-second response window with visible countdown
    setTimeLeft(5);
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    responseTimeoutRef.current = setTimeout(async () => {
      // If a new prompt has started, don't act on this timeout
      if (promptId !== activePromptIdRef.current) return;

      setTimeLeft(0);
      setIsListening(false);
      if (speechRecognition.current) {
        speechRecognition.current.stopListening();
      }

      setMessage("Time's up for this optotype. Moving to the next one.");
      if (speechSynthesis.current) {
        await speechSynthesis.current.speak("Time's up, moving on.");
      }

      // Record as incorrect / skipped response
      const skippedAnswer = '';
      recordResponse(skippedAnswer, item);
    }, 5000);
  };

  const handleVoiceResponse = (transcript, item) => {
    const raw = (transcript || '').toLowerCase();

    // Allow a simple "repeat" command to replay the current optotype instructions
    if (raw.includes('repeat') || raw.includes('again')) {
      setMessage('Repeating this letter. Please answer after the prompt.');
      // Reset timers and re-present the same optotype
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setTimeLeft(null);
      presentNextOptotype(currentIndex);
      return;
    }

    const userAnswer = normalizeDirectionInput(transcript);
    if (!userAnswer) {
      setMessage('Direction not recognized. Please repeat or type right, left, up, or down.');
      return;
    }
    recordResponse(userAnswer, item);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput || !testItems[currentIndex]) return;

    const item = testItems[currentIndex];
    const userAnswer = normalizeDirectionInput(manualInput);
    if (!userAnswer) {
      setMessage('Please type right, left, up, or down.');
      return;
    }
    setManualInput('');
    recordResponse(userAnswer, item);
  };

  const recordResponse = (userAnswer, item) => {
    // Clear active timers when a response is received
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setTimeLeft(null);

    const correct = userAnswer === item.direction;
    const elapsedSeconds = questionStartRef.current
      ? Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000))
      : 2;

    const response = {
      level: item.level,
      optotype: item.optotype,
      userResponse: userAnswer,
      correct,
      responseTime: elapsedSeconds,
      distance: distance ?? 50,
      eye: currentEyeRef.current
    };

    setResponses((prev) => {
      const updated = [...prev, response];
      responsesRef.current = updated;

      // Determine performance for this Snellen level (same eye only)
      const level = item.level;
      const levelResponses = updated.filter(
        (r) => r.level === level && r.eye === currentEyeRef.current
      );
      const lettersAnswered = levelResponses.length;
      const correctCount = levelResponses.filter((r) => r.correct).length;

      const isLastLetterOfLevel =
        lettersAnswered >= LETTERS_PER_LEVEL ||
        currentIndex === testItems.length - 1 ||
        (testItems[currentIndex + 1] && testItems[currentIndex + 1].level !== level);

      if (isLastLetterOfLevel) {
        if (correctCount >= CORRECT_TO_PASS_LEVEL) {
          // Passed this level – advance to next level
          lastPassedLevelRef.current = level;
          let nextIndex = currentIndex + 1;
          while (nextIndex < testItems.length && testItems[nextIndex].level === level) {
            nextIndex += 1;
          }

          if (nextIndex < testItems.length) {
            const targetIndex = nextIndex;
            setTimeout(() => {
              (async () => {
                if (speechSynthesis.current) {
                  await speechSynthesis.current.speak(
                    correct ? 'Correct.' : 'That is not correct.'
                  );
                }
                presentNextOptotype(targetIndex);
              })();
            }, 400);
          } else {
            setTimeout(() => {
              (async () => {
                if (speechSynthesis.current) {
                  await speechSynthesis.current.speak(
                    correct ? 'Correct.' : 'That is not correct.'
                  );
                }
                onEyeSessionComplete(updated, lastPassedLevelRef.current);
              })();
            }, 400);
          }
        } else {
          // Failed this level – stop the test, using last passed level as final score
          const finalLevel = lastPassedLevelRef.current || level;
          setTimeout(() => {
            (async () => {
              if (speechSynthesis.current) {
                await speechSynthesis.current.speak(
                  correct ? 'Correct.' : 'That is not correct.'
                );
              }
              onEyeSessionComplete(updated, finalLevel);
            })();
          }, 400);
        }
      } else {
        // Continue within the same level
        if (currentIndex + 1 < testItems.length) {
          const nextIndex = currentIndex + 1;
          setTimeout(() => {
            (async () => {
              if (speechSynthesis.current) {
                await speechSynthesis.current.speak(
                  correct ? 'Correct.' : 'That is not correct.'
                );
              }
              presentNextOptotype(nextIndex);
            })();
          }, 400);
        } else {
          const finalLevel = lastPassedLevelRef.current || level;
          setTimeout(() => {
            (async () => {
              if (speechSynthesis.current) {
                await speechSynthesis.current.speak(
                  correct ? 'Correct.' : 'That is not correct.'
                );
              }
              onEyeSessionComplete(updated, finalLevel);
            })();
          }, 400);
        }
      }

      return updated;
    });
  };

  const onEyeSessionComplete = async (allResponses, lastPassedLevelForSession = null) => {
    const eye = currentEyeRef.current;
    const slice = allResponses.filter((r) => r.eye === eye);
    const va = scoreCalc.current.calculateScore(slice, lastPassedLevelForSession);

    if (eye === 'right') {
      visualAcuityByEyeRef.current.right = va;
      lastPassedLevelRef.current = null;
      setStage('eye_prep_left');
      setMessage(
        'Right eye (OD) screening is done. Next we will test your left eye only.'
      );
      if (speechSynthesis.current) {
        await speechSynthesis.current.speak(
          'Right eye screening is complete. Now cover your right eye with your hand so you only see with your left eye. Press continue when you are ready.'
        );
      }
      return;
    }

    visualAcuityByEyeRef.current.left = va;
    await finalizeAndSubmitTest(allResponses);
  };

  const finalizeAndSubmitTest = async (allResponses) => {
    setStage('complete');
    setMessage('Calculating your visual acuity...');

    if (!allResponses || allResponses.length === 0) {
      setMessage('No responses recorded. Please retake the test.');
      return;
    }

    const vaRight = visualAcuityByEyeRef.current.right;
    const vaLeft = visualAcuityByEyeRef.current.left;
    if (!vaRight?.snellen || !vaLeft?.snellen) {
      setMessage('Could not compute both eye scores. Please retake the test.');
      return;
    }
    const visualAcuity = scoreCalc.current.pickWorseVisualAcuity(vaRight, vaLeft);
    setVisualResult(visualAcuity);

    const avgDistance = Math.round(
      allResponses.reduce((sum, r) => sum + (r.distance || 0), 0) / allResponses.length
    );
    const avgResponseTime = allResponses.reduce(
      (sum, r) => sum + (r.responseTime || 0),
      0
    ) / allResponses.length;
    const totalDuration = allResponses.reduce(
      (sum, r) => sum + (r.responseTime || 0),
      0
    );

    const pauses = pauseEventsRef.current || [];

    // Consistency component (0–1): proportion of correct responses
    const totalResponses = allResponses.length;
    const correctCount = allResponses.filter((r) => r.correct).length;
    const consistencyScore =
      totalResponses > 0 ? correctCount / totalResponses : 0;

    // Response time stability component (0–1):
    // low variance in response times → higher score
    const responseTimes = allResponses.map((r) => r.responseTime || 0);
    const meanRt = avgResponseTime || 0;
    const variance =
      responseTimes.length > 0
        ? responseTimes.reduce(
            (sum, rt) => sum + (rt - meanRt) * (rt - meanRt),
            0
          ) / responseTimes.length
        : 0;
    const stdRt = Math.sqrt(variance);
    let responseStabilityScore;
    if (responseTimes.length <= 1) {
      responseStabilityScore = 1;
    } else if (stdRt <= 1) {
      responseStabilityScore = 1;
    } else if (stdRt >= 3) {
      responseStabilityScore = 0;
    } else {
      // Linearly drop from 1 at 1s std dev to 0 at 3s
      responseStabilityScore = 1 - (stdRt - 1) / (3 - 1);
    }

    // Condition quality component (0–1):
    // how close average distance is to 50cm, penalised by pauses
    const distanceDelta = Math.abs((avgDistance || 50) - 50);
    const distanceScore = Math.max(0, 1 - distanceDelta / 20); // 0 at ≥70 or ≤30
    const pausePenaltyUnit = Math.min(pauses.length * 0.15, 0.6);
    const conditionQualityScore = Math.max(0, distanceScore - pausePenaltyUnit);

    // Final confidence score (0–100) using 50/30/20 weighting
    const confidenceScoreRaw =
      0.5 * consistencyScore +
      0.3 * responseStabilityScore +
      0.2 * conditionQualityScore;

    const reliability = {
      confidenceScore: Math.round(
        Math.max(0, Math.min(1, confidenceScoreRaw)) * 100
      ),
      consistencyScore,
      averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      pauses
    };
    setReliabilitySummary(reliability);

    // Map pause events into backend-compatible violation records
    const violations = pauses.map((p) => {
      const reason = (p.reason || '').toLowerCase();
      let type = 'movement';
      if (
        reason.includes('distance') ||
        reason.includes('close') ||
        reason.includes('far')
      ) {
        type = 'distance';
      } else if (
        reason.includes('light') ||
        reason.includes('bright') ||
        reason.includes('dark') ||
        reason.includes('glare')
      ) {
        type = 'lighting';
      } else if (
        reason.includes('posture') ||
        reason.includes('head') ||
        reason.includes('face')
      ) {
        type = 'posture';
      }

      return {
        type,
        count: 1,
        reason: p.reason || '',
        durationSeconds: p.durationSeconds ?? 0,
        timestamp: new Date()
      };
    });

    const clampedAvgDistance = Math.min(
      150,
      Math.max(20, Number.isFinite(avgDistance) ? avgDistance : 50)
    );

    const responsesForApi = allResponses.map((r) => {
      const next = { ...r };
      // Always send a string so JSON never omits the field (Mongoose requires userResponse).
      next.userResponse =
        typeof r.userResponse === 'string' ? r.userResponse.slice(0, 10) : '';
      const d = r.distance;
      if (d != null && Number.isFinite(Number(d))) {
        next.distance = Math.min(150, Math.max(20, Number(d)));
      } else {
        delete next.distance;
      }
      return next;
    });

    const eyePayload = (v) =>
      v && typeof v === 'object'
        ? {
            snellen: v.snellen,
            logMAR: v.logMAR,
            ...(v.decimal != null ? { decimal: v.decimal } : {})
          }
        : v;

    const testData = {
      visualAcuity: {
        snellen: visualAcuity.snellen,
        logMAR: visualAcuity.logMAR,
        decimal: visualAcuity.decimal
      },
      visualAcuityByEye: {
        right: eyePayload(vaRight),
        left: eyePayload(vaLeft)
      },
      classification: visualAcuity.classification,
      testConditions: {
        averageDistance: clampedAvgDistance,
        lightingLevel: lightingStatus?.mean ? Math.round(lightingStatus.mean) : 100,
        lightingQuality: lightingStatus?.quality || 'UNKNOWN',
        testMode: 'monocular',
        distanceCalibrationSource: getCalibrationSourceForPayload(),
        violations,
        ...(glassesDetectedRef.current ? { glassesDetected: true } : {})
      },
      reliability,
      responses: responsesForApi,
      testDuration: Math.max(60, totalDuration)
    };

    try {
      const res = await testApi.createTest(testData);
      const rawId = res.data?.data?.test?._id;
      const createdId = rawId != null ? String(rawId) : null;
      if (speechSynthesis.current) {
        await speechSynthesis.current.speak(
          `Your test is complete. Right eye ${vaRight.snellen}, left eye ${vaLeft.snellen}. Overall screening result ${visualAcuity.snellen}, based on the weaker eye.`
        );
      }
      setMessage('Test complete. Preparing your detailed results...');
      if (createdId) {
        setTimeout(() => navigate(`/results/${createdId}`), 1500);
      } else {
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (error) {
      console.error('Error saving test:', error);
      const apiErrors = error?.response?.data?.errors;
      const detail =
        Array.isArray(apiErrors) && apiErrors.length > 0
          ? (typeof apiErrors[0] === 'string'
              ? apiErrors.join(' ')
              : apiErrors.map((e) => e?.message || e?.field || String(e)).join(' '))
          : null;
      const apiMsg = error?.response?.data?.message;
      setMessage(
        detail ||
          apiMsg ||
          (error?.message?.includes('Network Error')
            ? 'Cannot reach the server. Check the API is running and VITE_API_URL if you use a custom backend URL.'
            : 'Error saving results. Please try again from a stable connection.')
      );
    }
  };

  useEffect(() => {
    const keyToDirection = {
      ArrowRight: 'right',
      ArrowLeft: 'left',
      ArrowUp: 'up',
      ArrowDown: 'down'
    };

    const handleKeyDown = (e) => {
      const answer = keyToDirection[e.key];
      if (!answer) return;
      if (stage !== 'testing') return;

      const item = testItems[currentIndex];
      if (!item) return;

      e.preventDefault();
      recordResponse(answer, item);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [stage, currentIndex, testItems]);

  const currentItem = testItems[currentIndex];
  const currentLevel = currentItem?.level;
  const currentDenominator = currentLevel ? parseInt(currentLevel.split('/')[1]) : 200;
  const getOptotypeDistanceCm = (d, status) => {
    if (d == null || !Number.isFinite(d)) return 50;
    if (d >= 142) return 50;
    if (status?.isValid) return Math.min(d, 95);
    return 50;
  };
  const optotypeDistanceCm = getOptotypeDistanceCm(distance, distanceStatus);
  const distanceUnreliableForSizing =
    distance != null && (distance >= 142 || !distanceStatus?.isValid);
  const optotypeSizePx = optotypeGen.current.calculateSize(
    currentDenominator,
    optotypeDistanceCm
  );
  const directionToRotation = {
    right: 'rotate(0deg)',
    left: 'rotate(180deg)',
    up: 'rotate(270deg)',
    down: 'rotate(90deg)'
  };
  const dPadButtons = [
    { key: 'up', icon: '↑', row: '1', col: '2' },
    { key: 'left', icon: '←', row: '2', col: '1' },
    { key: 'right', icon: '→', row: '2', col: '3' },
    { key: 'down', icon: '↓', row: '3', col: '2' }
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 mb-1">Vision test</h1>
      <p className="text-sm text-gray-600 mb-3">
        One eye at a time. Icons below = what to do.
      </p>
      <VisualTestSteps />
      <p className="text-xs text-gray-500 mb-6">
        <Link
          to="/calibration"
          state={{ returnTo: '/test' }}
          className="text-blue-600 hover:underline font-medium"
        >
          Open calibration
        </Link>{' '}
        if you skipped the step at the start (a ruler for your webcam, not AI training).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera and environment panel */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-900">
            <video
              ref={videoRef}
              className="w-full h-72 object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/50 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4 text-xs text-slate-100 flex justify-between gap-3">
              <div>
                <p className="uppercase tracking-wide text-[10px] text-slate-300 mb-1">
                  Distance
                </p>
                <p className="text-sm font-semibold">
                  {distance ? `${distance} cm` : 'Detecting...'}
                </p>
                {distanceStatus && (
                  <p className="text-[11px] text-slate-300">{distanceStatus.message}</p>
                )}
                {distanceUnreliableForSizing && (
                  <p className="text-[10px] text-amber-200 mt-1">
                    Letter size uses ~50 cm (nominal) because distance is uncertain. Calibrate on
                    the calibration page for better letter sizing.
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="uppercase tracking-wide text-[10px] text-slate-300 mb-1">
                  Posture
                </p>
                {posture ? (
                  <>
                    <p className="text-sm font-semibold">
                      Yaw {posture.yaw}° · Roll {posture.roll}°
                    </p>
                    {postureStatus && (
                      <p className="text-[11px] text-slate-300">
                        {postureStatus.message}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-semibold">Analyzing...</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatusChip
              label="Camera"
              value={initializationError ? 'Error' : 'Active'}
              tone={initializationError ? 'error' : 'ok'}
            />
            <StatusChip
              label="Distance"
              value={distanceStatus?.status || 'Calibrating'}
              tone={distanceStatus?.isValid ? 'ok' : 'warn'}
            />
            <StatusChip
              label="Posture"
              value={postureStatus?.status || 'Calibrating'}
              tone={postureStatus?.isValid ? 'ok' : 'warn'}
            />
            <StatusChip
              label="Lighting"
              value={lightingStatus?.quality || 'Analyzing'}
              tone={
                !lightingStatus
                  ? 'info'
                  : lightingStatus.status === 'optimal'
                  ? 'ok'
                  : 'warn'
              }
            />
            <StatusChip
              label="Face"
              value={faceDetected ? 'Detected' : 'Not detected'}
              tone={faceDetected ? 'ok' : 'warn'}
            />
            <StatusChip
              label="Voice"
              value={voiceSupported ? (isListening ? 'Listening…' : 'Ready') : 'Typing'}
              tone={voiceSupported ? 'ok' : 'info'}
            />
          </div>
        </div>

        {/* Test interaction panel */}
        <div className="flex flex-col justify-center items-center">
          {stage === 'setup' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4 mx-auto" />
              <p className="text-lg">{message}</p>
              {initializationError && (
                <p className="mt-3 text-sm text-red-600">{initializationError}</p>
              )}
            </div>
          )}

          {stage === 'calibration_gate' && (
            <div className="text-center max-w-md mx-auto space-y-5">
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/80 px-4 py-5">
                <p className="text-lg font-semibold text-slate-900 mb-2">First: calibrate distance</p>
                <p className="text-sm text-slate-700 mb-4 leading-snug">
                  Your Snellen score only makes sense if the “E” is sized for <strong>your</strong>{' '}
                  screen and <strong>how far you sit</strong>. Two minutes, one credit card.
                </p>
                <Link
                  to="/calibration"
                  state={{ returnTo: '/test' }}
                  className="inline-flex w-full justify-center rounded-xl bg-emerald-600 text-white font-semibold py-3 px-4 hover:bg-emerald-700"
                >
                  Calibrate now (recommended)
                </Link>
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">or</div>
              <div className="text-left rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-4 space-y-3">
                <label className="flex gap-3 items-start cursor-pointer text-sm text-slate-800">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-slate-300"
                    checked={skipApproxAck}
                    onChange={(e) => setSkipApproxAck(e.target.checked)}
                  />
                  <span>
                    I understand this is <strong>screening only</strong> and without calibration
                    the letter size and distance are <strong>rough estimates</strong>; results are
                    less meaningful.
                  </span>
                </label>
                <button
                  type="button"
                  disabled={!skipApproxAck}
                  onClick={() => {
                    acknowledgeApproximateResultsThisSession();
                    setStage('calibration');
                    setMessage(
                      'Please sit about 50 cm from the screen and look straight at the camera.'
                    );
                    if (speechSynthesis.current) {
                      speechSynthesis.current.speak(
                        'Please sit about fifty centimeters from the screen and look straight at the camera.'
                      );
                    }
                  }}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold ${
                    skipApproxAck
                      ? 'bg-slate-700 text-white hover:bg-slate-800'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Continue without calibrating
                </button>
              </div>
            </div>
          )}

          {stage === 'calibration' && (
            <div className="text-center max-w-md">
              <div className="flex justify-center gap-3 mb-3 text-blue-600" aria-hidden>
                <HiOutlineEye className="h-10 w-10" />
                <HiOutlineEye className="h-10 w-10" />
              </div>
              <p className="text-lg font-medium mb-2">{message}</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-1.5 text-left max-w-xs mx-auto list-none">
                <li className="flex gap-2 items-start">
                  <span className="text-blue-600 font-bold">1</span>
                  <span>Both eyes open, face the camera.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-blue-600 font-bold">2</span>
                  <span>Wait until distance &amp; lighting show OK (green).</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-blue-600 font-bold">3</span>
                  <span>Press Start, then we test each eye alone.</span>
                </li>
              </ul>
              <button
                onClick={handleStartTest}
                disabled={!canStartTest()}
                className={`px-8 py-3 rounded-lg text-lg font-semibold shadow transition ${
                  canStartTest()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Start Test
              </button>
            </div>
          )}

          {stage === 'eye_prep_right' && (
            <div className="text-center max-w-lg">
              <p className="text-lg font-semibold text-gray-900 mb-1">Step A: Right eye</p>
              <div className="flex justify-center items-center gap-2 mb-3 text-5xl text-slate-400">
                <HiOutlineHandRaised className="text-amber-600 h-12 w-12" aria-hidden />
                <span className="text-2xl">→</span>
                <HiOutlineEye className="text-blue-600 h-14 w-14" />
              </div>
              <p className="text-sm text-gray-700 mb-4 font-medium">
                Cover your <strong>left</strong> eye. Look with <strong>right</strong> only.
              </p>
              <p className="text-xs text-gray-600 mb-3">
                You’ll see a rotating <strong>E</strong>: pick which way the <strong>gap</strong> opens (same as
                the D-pad).
              </p>
              <p className="text-xs text-gray-500 mb-4">Don’t block the camera.</p>
              <button
                type="button"
                onClick={() => handleBeginEyeSession('right')}
                disabled={!canBeginEyeSession()}
                className={`px-8 py-3 rounded-lg text-lg font-semibold shadow transition ${
                  canBeginEyeSession()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Continue: I am covering my left eye
              </button>
            </div>
          )}

          {stage === 'eye_prep_left' && (
            <div className="text-center max-w-lg">
              <p className="text-lg font-semibold text-gray-900 mb-1">Step B: Left eye</p>
              <div className="flex justify-center items-center gap-2 mb-3 text-5xl text-slate-400">
                <HiOutlineHandRaised className="text-amber-600 h-12 w-12" />
                <span className="text-2xl">→</span>
                <HiOutlineEye className="text-blue-600 h-14 w-14" />
              </div>
              <p className="text-sm text-gray-700 mb-4 font-medium">
                Cover your <strong>right</strong> eye. Look with <strong>left</strong> only.
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Same task: rotating <strong>E</strong>. Say where the <strong>gap</strong> points.
              </p>
              <button
                type="button"
                onClick={() => handleBeginEyeSession('left')}
                disabled={!canBeginEyeSession()}
                className={`px-8 py-3 rounded-lg text-lg font-semibold shadow transition ${
                  canBeginEyeSession()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Continue: I am covering my right eye
              </button>
            </div>
          )}

          {(stage === 'testing' || stage === 'paused') && currentItem && (
            <div className="text-center w-full max-w-md flex flex-col">
              <p className="text-sm text-slate-600 mb-1 order-1">
                {(() => {
                  const levels = Array.from(new Set(testItems.map((t) => t.level)));
                  const levelIndex = currentLevel ? levels.indexOf(currentLevel) + 1 : 0;
                  const levelResponsesCount = responses.filter(
                    (r) => r.level === currentLevel && r.eye === currentEye
                  ).length;
                  const letterNumber = Math.min(
                    LETTERS_PER_LEVEL,
                    levelResponsesCount + 1
                  );
                  const eyeLabel = currentEye === 'right' ? 'Right (OD)' : 'Left (OS)';
                  return `${eyeLabel} · Level ${levelIndex} of ${levels.length} · Letter ${letterNumber} of ${LETTERS_PER_LEVEL} · ${currentLevel}`;
                })()}
              </p>
              <p className="text-sm text-slate-500 mb-3 order-2 min-h-[1.25rem]">
                {stage === 'paused'
                  ? 'Test paused due to unstable conditions.'
                  : timeLeft !== null
                  ? `Time left: ${timeLeft}s`
                  : '\u00A0'}
              </p>

              {/* No CSS transition on transform/size: animating rotation between trials cues the answer */}
              <div className="order-3 mb-3">
                <div
                  key={`${currentEye}-${currentIndex}`}
                  className="font-bold transition-none select-none inline-block"
                  style={{
                    fontSize: `${optotypeSizePx}px`,
                    lineHeight: 1,
                    transform: directionToRotation[currentItem.direction] || 'rotate(0deg)'
                  }}
                >
                  E
                </div>
              </div>

              {showGlassesWarning && (
                <div
                  className="order-4 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-md text-sm mb-3 text-left"
                  role="alert"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">
                      Glasses detected. For best results, test without glasses if possible. You
                      can continue wearing them.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowGlassesWarning(false)}
                      className="ml-2 text-amber-900 opacity-70 hover:opacity-100 font-bold shrink-0"
                      aria-label="Dismiss glasses warning"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Controls directly under the E so touch/keyboard stay near the letter */}
              <div className="order-5 flex flex-col items-center gap-3 w-full">
                <p className="text-sm text-slate-700 font-medium">
                  {voiceSupported
                    ? 'Tap a direction, use arrow keys, or type R / L / U / D'
                    : 'Tap a direction, use arrow keys, or type below'}
                </p>

                <div
                  className="mx-auto grid gap-2 max-w-[200px] w-full"
                  style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}
                >
                  {dPadButtons.map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      style={{ gridRow: btn.row, gridColumn: btn.col }}
                      onClick={() => {
                        const item = testItems[currentIndex];
                        if (!item) return;
                        recordResponse(btn.key, item);
                      }}
                      className="h-14 min-h-[48px] rounded-lg border-2 border-slate-300 bg-white text-xl font-semibold text-slate-800 shadow-sm hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100"
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleManualSubmit} className="w-full max-w-[200px] flex flex-col items-center gap-2">
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    maxLength={10}
                    className="w-full h-14 text-2xl text-center border-2 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="R / L / U / D"
                    aria-label="Type direction"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-sm font-semibold"
                    disabled={!manualInput}
                  >
                    Submit
                  </button>
                </form>

                {voiceSupported && (
                  <p className="text-xs text-slate-500">
                    {isListening ? 'Listening…' : 'Waiting for your response.'}
                  </p>
                )}

                {message && (
                  <p className="text-sm text-slate-700 bg-slate-100 rounded-lg px-3 py-2 w-full" role="status">
                    {message}
                  </p>
                )}

                {stage === 'paused' && (
                  <p className="text-sm text-amber-700">
                    {resumeCountdown != null
                      ? `Conditions look good. Resuming in ${resumeCountdown}…`
                      : 'Please fix the issue shown above to continue.'}
                  </p>
                )}
              </div>

              <details className="order-6 mt-6 text-left border-t border-slate-200 pt-4">
                <summary className="text-sm font-medium text-slate-800 cursor-pointer marker:text-slate-400">
                  How this test works
                </summary>
                <div className="mt-3 text-xs text-slate-600 leading-relaxed space-y-2 pl-0.5">
                  <p>
                    Each <strong>E</strong> is shown in its final direction only (no turning animation). Say
                    which way the <strong>gap</strong> opens: <strong>right, left, up,</strong> or{' '}
                    <strong>down</strong> (same as the pad).
                  </p>
                  <p>
                    If you cannot see it clearly, guess anyway. That still tells us when to stop and how to
                    score your last reliable line size.
                  </p>
                </div>
              </details>
            </div>
          )}

          {stage === 'complete' && (
            <div className="text-center">
              <div className="text-6xl mb-4 text-emerald-500">✓</div>
              <p className="text-2xl font-bold mb-2">Test complete</p>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ label, value, tone }) {
  const tones = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${tones[tone] || tones.info}`}>
      <p className="uppercase tracking-wide text-[10px] opacity-70">{label}</p>
      <p className="font-semibold mt-0.5">{value}</p>
    </div>
  );
}

export default TestPage;