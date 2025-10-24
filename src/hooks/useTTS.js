// src/hooks/useTTS.js
import { useEffect, useState } from 'react';
import Tts from 'react-native-tts';

const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Initialize TTS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(2);
    // Tts.voices().then(voices => console.log(voices));
    // Tts.engines().then(engines => console.log(engines));
    Tts.setDefaultVoice('en-US-SMTf00');

    // Track TTS events
    const startListener = Tts.addEventListener('tts-start', () => setIsSpeaking(true));
    const finishListener = Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
    const cancelListener = Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));

    // Cleanup
    return () => {
      startListener.remove();
      finishListener.remove();
      cancelListener.remove();
    };
  }, []);

  const speak = async (text) => {
    try {
      setIsSpeaking(true);
      await Tts.stop();
      await Tts.speak(text);
    } catch (err) {
      console.error('TTS speak error:', err);
      setIsSpeaking(false);
    }
  };

  const stopTTS = async () => {
    try {
      await Tts.stop();
      setIsSpeaking(false);
    } catch (err) {
      console.error('TTS stop error:', err);
    }
  };

  return { speak, stopTTS, isSpeaking };
};

export default useTTS;
