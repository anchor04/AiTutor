import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import Voice from '@react-native-voice/voice';

const VoiceInputComponent = () => {
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // When speech recognition returns results
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setRecognizedText(e.value[0]);
      } else {
        console.log('⚠️ No speech detected');
        setIsListening(false);
      }
    };

    // When user stops speaking
    Voice.onSpeechEnd = () => {
      console.log('🎤 Speech ended');
      setIsListening(false);
    };

    // Handle errors (including "No match")
    Voice.onSpeechError = (e) => {
      const code = e?.error?.code || '';
      const message = e?.error?.message || '';

      // Ignore harmless "no match" errors
      if (message.includes('No match') || code.includes('7/No match')) {
        console.log('🤫 Ignoring harmless "no match" error');
        setIsListening(false);
        return;
      }

      // Log or handle any other unexpected error
      console.error('🚨 Speech error:', e);
      setIsListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      setRecognizedText('');
      setIsListening(true);
      await Voice.start('en-US');
    } catch (e) {
      console.error('Start listening error:', e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error('Stop listening error:', e);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Recognized Text: {recognizedText || '—'}
      </Text>

      <Button
        title={isListening ? 'Stop Listening' : 'Start Listening'}
        onPress={isListening ? stopListening : startListening}
      />

      {isListening && (
        <Text style={{ marginTop: 10, color: 'gray' }}>🎤 Listening...</Text>
      )}
    </View>
  );
};

export default VoiceInputComponent;
