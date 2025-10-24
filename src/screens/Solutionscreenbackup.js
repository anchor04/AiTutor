// src/screens/SolutionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import Voice from '@react-native-voice/voice';
import useTTS from '../hooks/useTTS';
import Colors from '../../assets/colors';
import TutorModal from '../utils/Modal';

// 🧩 Complex Tutor View (premium mode)
const ComplexTutorView = ({
  aiResponse,
  imagePath,
  Colors,
  speak,
  stopTTS,
  isPaused,
  cancelRef,
}) => {
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [displayedText, setDisplayedText] = useState('');
  const [displayedWordsCount, setDisplayedWordsCount] = useState(0);
  const scrollRef = useRef(null);

  // 🎤 Voice input
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTypingOrSpeaking, setIsTypingOrSpeaking] = useState(false);

  const pastelPalette = [
    '#fcfaefff',
    '#f6fff7ff',
    '#f2f8ffff',
    '#ffeff3ff',
    '#fffbf1ff',
    '#f7f1ffff',
  ];
  const pickColor = (idx) => pastelPalette[idx % pastelPalette.length];

  // 🎧 Voice setup
  // useEffect(() => {
  //   Voice.onSpeechResults = (e) => {
  //     if (e.value?.length > 0) setInputText(e.value[0]);
  //   };
  //   Voice.onSpeechEnd = () => setIsListening(false);
  //   Voice.onSpeechError = (e) => {
  //     console.error('Speech error:', e);
  //     setIsListening(false);
  //   };

  //   return () => {
  //     Voice.destroy().then(Voice.removeAllListeners);
  //   };
  // }, []);

  // // 🎤 Mic controls
  // const startVoiceInput = async () => {
  //   try {
  //     setInputText('');
  //     setIsTypingOrSpeaking(true);
  //     setIsListening(true);
  //     await Voice.start('en-US');
  //   } catch (e) {
  //     console.error('Voice start error:', e);
  //     setIsListening(false);
  //   }
  // };

  // const stopVoiceInput = async () => {
  //   try {
  //     await Voice.stop();
  //     setIsListening(false);
  //   } catch (e) {
  //     console.error('Voice stop error:', e);
  //   }
  // };

  const toggleKeyboardInput = () => {
    setIsTypingOrSpeaking((prev) => !prev);
    if (!isTypingOrSpeaking) setInputText('');
  };

  const handleSend = () => {
    console.log('User input:', inputText);
    setIsTypingOrSpeaking(false);
    setIsListening(false);
    setInputText('');
  };

  // 🧠 Step playback logic
  useEffect(() => {
    if (!Array.isArray(aiResponse) || aiResponse.length === 0) return;

    let cancelled = false;
    cancelRef.current = false;

    const playAllSteps = async () => {
      for (let idx = 0; idx < aiResponse.length; idx++) {
        const step = aiResponse[idx];
        if (cancelRef.current || cancelled) break;

        if (!step.equation) continue;

        await new Promise((r) => setTimeout(r, 500));

        setVisibleSteps((prev) => {
          const next = [...prev, step];
          setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
          return next;
        });

        const explanation = step.explanation || '';
        try {
          speak(explanation);
        } catch (e) {}

        const words = explanation.split(/\s+/).filter(Boolean);
        setDisplayedText('');
        setDisplayedWordsCount(0);

        for (let w = 0; w < words.length; w++) {
          if (cancelRef.current || cancelled) break;

          while (isPaused) {
            if (cancelRef.current || cancelled) break;
            await new Promise((r) => setTimeout(r, 200));
          }

          if (cancelRef.current || cancelled) break;

          setDisplayedWordsCount((prev) => prev + 1);
          setDisplayedText(words.slice(0, w + 1).join(' '));
          await new Promise((r) => setTimeout(r, Math.max(words[w].length * 110, 250)));
        }

        if (cancelRef.current || cancelled) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
    };

    playAllSteps();

    return () => {
      cancelled = true;
      cancelRef.current = true;
      stopTTS();
      setDisplayedText('');
      setDisplayedWordsCount(0);
      setVisibleSteps([]);
    };
  }, [aiResponse, isPaused]);

  // --- JSX ---
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          alignItems: 'center',
          paddingVertical: 30,
          paddingBottom: 240,
        }}
      >
        {imagePath ? (
          <Image
            source={{ uri: imagePath }}
            resizeMode="contain"
            style={{
              width: '90%',
              height: 120,
              alignSelf: 'center',
              marginVertical: 10,
              borderRadius: 12,
            }}
          />
        ) : null}

        {visibleSteps
          .filter((step) => step.equation)
          .map((step, idx) => (
            <View
              key={`${step.equation}-${idx}`}
              style={{
                width: '90%',
                borderRadius: 14,
                paddingVertical: 28,
                paddingHorizontal: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pickColor(idx),
                marginBottom: 20,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Roboto Bold',
                  color: Colors.black,
                }}
              >
                {step.equation}
              </Text>
            </View>
          ))}
      </ScrollView>

      {/* Explanation Area */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 80,
          backgroundColor: '#fff',
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderTopWidth: 1,
          borderTopColor: '#ececec',
        }}
      >
        <Text style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 6 }}>
          Explanation
        </Text>
        <Text style={{ fontSize: 18, color: '#111', lineHeight: 26 }}>
          {displayedText}
          <Text style={{ color: '#aaa' }}>
            {displayedWordsCount === 0 ? '' : ' ▍'}
          </Text>
        </Text>
      </View>

      {/* 🎤 Mic + Keyboard UI */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isTypingOrSpeaking && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f6f6f6',
              borderRadius: 30,
              paddingHorizontal: 15,
              paddingVertical: 8,
              width: '90%',
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#e1e1e1',
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={isListening ? 'Listening...' : 'Type your question'}
              placeholderTextColor="#aaa"
              style={{
                flex: 1,
                fontSize: 16,
                color: Colors.black,
                paddingVertical: 4,
              }}
            />
            <TouchableOpacity onPress={handleSend}>
              <Text
                style={{
                  fontSize: 22,
                  color: Colors.red,
                  fontWeight: '600',
                  paddingLeft: 8,
                }}
              >
                ➤
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <TouchableOpacity
            // onPress={isListening ? stopVoiceInput : startVoiceInput}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isListening ? '#16a34a' : Colors.red,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 26, color: '#fff' }}>
              {isListening ? '🟢' : '🎤'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleKeyboardInput}
            style={{
              position: 'absolute',
              right: 25,
              bottom: 12,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#ddd',
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 22 }}>⌨️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};



// 🧮 MAIN SCREEN
const SolutionScreen = ({ route, navigation }) => {
  const { imagePath, aiResponse, autoSpeak, usermode: initialMode, base64Image, finalAnswer } =
    route.params || {};

  const [usermode, setUsermode] = useState(initialMode || 'basic');
  const cancelRef = useRef(false);
  const [steps, setSteps] = useState([]);
  const { speak, stopTTS } = useTTS();
  const modalRef = useRef(null);

  const onOpenModal = () => modalRef.current?.openModal();

  useEffect(() => {
    if (!aiResponse) return;
    if (Array.isArray(aiResponse)) setSteps(aiResponse);
    else if (typeof aiResponse === 'object' && aiResponse.steps)
      setSteps(aiResponse.explanation);
    else setSteps([]);
  }, [aiResponse]);

  // AutoSpeak only if premium
  useEffect(() => {
    if (autoSpeak && usermode === 'premium' && aiResponse) {
      console.log('🔊 AutoSpeak active (premium)');
    } else {
      console.log('AutoSpeak skipped (basic mode)');
    }
  }, [autoSpeak, aiResponse, usermode]);

  const renderNormalScreen = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.bannerContainer}>
        <Image source={{ uri: imagePath }} style={styles.bannerImage} blurRadius={10} />
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerContent}>
          <Image source={{ uri: imagePath }} resizeMode="contain" style={styles.TopImage} />
        </View>
      </View>

      <View style={styles.cardHeader}>
        <TouchableOpacity onPress={onOpenModal}>
          <Text style={styles.aiName}>Tutor AI ▼</Text>
        </TouchableOpacity>
        <Text style={[styles.aiName, { color: Colors.lightgray, fontWeight: '400' }]}>
          Ask again ↻
        </Text>
      </View>

      <View style={styles.answerCard}>
        <View style={styles.answerWrapper}>
          <View style={styles.redBar} />
          <View style={{ flex: 1 }}>
            <View style={styles.answerRow}>
              <View style={styles.halfRedDot} />
              <Text style={styles.answerNumber}>{finalAnswer}</Text>
            </View>
            <View style={styles.answerSeparator} />

            {steps && steps.length > 0 ? (
              steps.map((item, index) => (
                <View key={index} style={[styles.stepLine, { marginTop: index === 0 ? 14 : 20 }]}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>{item.step}</Text>
                  </View>
                  <Text style={styles.stepText}>{item.explanation}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: Colors.darkgray, marginTop: 20 }}>
                Waiting for AI to analyze the image...
              </Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Basic Mode */}
        {usermode !== 'premium' && renderNormalScreen()}

        {/* Premium Mode */}
        {usermode === 'premium' && (
          <ComplexTutorView
            aiResponse={aiResponse}
            imagePath={imagePath}
            Colors={Colors}
            speak={speak}
            stopTTS={stopTTS}
            cancelRef={cancelRef}
          />
        )}

        <TutorModal
          ref={modalRef}
          navigation={navigation}
          base64Image={base64Image}
          imagePath={imagePath}
          onTutorSelect={(selectedMode) => setUsermode(selectedMode)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default SolutionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1, backgroundColor: '#f6f6f6ff', paddingTop: 20, paddingBottom: 200 },
  bannerContainer: {
    height: 120,
    width: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 16,
    marginLeft: 20,
  },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  bannerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  TopImage: { height: '100%', width: '100%' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginHorizontal: 20,
    backgroundColor: '#efefefff',
    borderTopStartRadius: 30,
    borderTopEndRadius: 30,
    height: 45,
    alignItems: 'center',
  },
  aiName: { fontSize: 15, color: Colors.darkgray, fontWeight: '600', paddingHorizontal: 10 },
  answerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    elevation: 1,
    marginBottom: 40,
  },
  answerWrapper: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  redBar: { width: 4, borderRadius: 6, marginRight: 10 },
  answerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, height: 60 },
  halfRedDot: {
    width: 8,
    height: 22,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: Colors.red,
    right: 26,
  },
  answerNumber: { fontSize: 25, color: Colors.black, fontFamily: 'Roboto Bold' },
  answerSeparator: { height: 1, backgroundColor: Colors.lightmediumgray, marginVertical: 8 },
  stepLine: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 15 },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: Colors.lightmediumgray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNum: { fontWeight: '600', fontSize: 10, color: '#a7a7a7ff' },
  stepText: {
    flex: 1,
    fontSize: 20,
    color: Colors.black,
    lineHeight: 30,
    fontFamily: 'AwanZaman Regular',
  },
});
