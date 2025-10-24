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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Voice from '@react-native-voice/voice';
import useTTS from '../hooks/useTTS';
import Colors from '../../assets/colors';
import TutorModal from '../utils/Modal';
import Ionicons from '@react-native-vector-icons/ionicons';

// 🧩 Complex Tutor View (premium mode)
const ComplexTutorView = ({
  aiResponse,
  imagePath,
  Colors,
  speak,
  stopTTS,
  isPaused,
  cancelRef,
  isSpeaking, 
}) => {
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [displayedText, setDisplayedText] = useState('');
  const [displayedWordsCount, setDisplayedWordsCount] = useState(0);
  
  //for static answer 
  const [showAnswer, setShowAnswer] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState('');

// scroll
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
  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      if (e.value?.length > 0) setInputText(e.value[0]);
    };
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      console.error('Speech error:', e);
      setIsListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // 🎤 Mic controls
  const startVoiceInput = async () => {
    try {
      setInputText('');
      setIsTypingOrSpeaking(true);
      setIsListening(true);
      await Voice.start('en-US');
    } catch (e) {
      console.error('Voice start error:', e);
      setIsListening(false);
    }
  };

  const stopVoiceInput = async () => {
    try {
     await Voice.stop();
    setIsListening(false);

    // 🧠 Show user’s spoken text
    if (inputText.trim()) {
      // setShowActivity(true);
   setIsTypingOrSpeaking(false);

      // Wait for UI to render gray box
      await new Promise((r) => setTimeout(r, 200));

      // Now show the activity spinner
      setShowActivity(true);

      // Auto-scroll down so spinner is visible
      scrollRef.current?.scrollToEnd({ animated: true });
      // After short delay, show static answer
      setTimeout(() => {
        const answerText = `Both are rules that tell us the correct order of operations when solving a math expression — meaning which part to calculate first so that everyone gets the same answer.
        They’re just two versions of the same concept used in different regions: 
        PEMDAS – used mostly in the U.S. Parentheses, Exponents, Multiplication, Division, Addition, Subtraction 
        BODMAS – used mostly in the U.K. and Commonwealth countries. Brackets, Orders, Division, Multiplication, Addition, Subtraction`
        setShowActivity(false);
        setShowAnswer(true);
        setFinalAnswer(answerText);

        // Narrate the answer via TTS
         stopTTS();
        speak(answerText);
       
        // Scroll again to show the answer fully
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 3000);
    }
  } catch (e) {
    console.error('Voice stop error:', e);
  }
};
  const toggleKeyboardInput = () => {
    setIsTypingOrSpeaking((prev) => !prev);
    if (!isTypingOrSpeaking) setInputText('');
  };

const handleSend = () => {
  if (!inputText.trim()) return;

  // Keep the gray question box visible permanently
  setIsTypingOrSpeaking(false);
  setShowAnswer(false);
  setShowActivity(false);

  // Wait briefly to ensure gray box renders first
  setTimeout(() => {
    setShowActivity(true);
    scrollRef.current?.scrollToEnd({ animated: true });
  }, 200);

  // After 3 seconds, clear explanation, stop spinner, and show answer
  setTimeout(() => {
    const answerText = `Both are rules that tell us the correct order of operations when solving a math expression — meaning which part to calculate first so that everyone gets the same answer.
They’re just two versions of the same concept used in different regions: 
PEMDAS – used mostly in the U.S. Parentheses, Exponents, Multiplication, Division, Addition, Subtraction 
BODMAS – used mostly in the U.K. and Commonwealth countries. Brackets, Orders, Division, Multiplication, Addition, Subtraction`;

    // 🧹 clear explanation box
    setDisplayedText('');
    setDisplayedWordsCount(0);

    // 🧠 stop spinner and show final answer
    setShowActivity(false);
    setShowAnswer(true);
    setFinalAnswer(answerText);

    // 🔊 speak final answer
    stopTTS();
    speak(answerText);

    // ensure everything scrolls into view
    scrollRef.current?.scrollToEnd({ animated: true });
  }, 3000);
};



  // Step playback logic
useEffect(() => {
  if (!Array.isArray(aiResponse) || aiResponse.length === 0) return;

  let cancelled = false;
  cancelRef.current = false;

  const playStepByStep = async () => {
    for (let idx = 0; idx < aiResponse.length; idx++) {
      if (cancelRef.current || cancelled) break;

      const step = aiResponse[idx];
      const explanation = step.explanation || '';
      const equation = step.equation || '';

      // 1️⃣ Speak and show explanation first
      setDisplayedText('');
      setDisplayedWordsCount(0);

      const words = explanation.split(/\s+/).filter(Boolean);
      try {
        speak(explanation);
      } catch (e) {
        console.warn('TTS error:', e);
      }

      for (let w = 0; w < words.length; w++) {
        if (cancelRef.current || cancelled) break;

        while (isPaused) {
          await new Promise((r) => setTimeout(r, 200));
          if (cancelRef.current || cancelled) return;
        }

        setDisplayedWordsCount((prev) => prev + 1);
        setDisplayedText(words.slice(0, w + 1).join(' '));

        // natural pacing
        await new Promise((r) =>
          setTimeout(r, Math.max(words[w].length * 110, 250))
        );
      }

      if (cancelRef.current || cancelled) break;

      // Small pause after explanation before showing equation
      await new Promise((r) => setTimeout(r, 1000));

      // 2️⃣ Now reveal the equation box
      if (equation) {
        setVisibleSteps((prev) => {
          const next = [...prev, step];
          setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 150);
          return next;
        });
      }

      // Short pause before next step starts
      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  playStepByStep();

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
    <View style={{ flex: 1, backgroundColor: Colors.scrollcolor }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          alignItems: 'center',
          paddingVertical: 10,
          paddingBottom: 240,
        }}
      >
        {imagePath ? (
        <View style={{height:150, width:'95%', borderRadius:20, backgroundColor:Colors.white, marginVertical:10}}>
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
            </View>
          ) : null}
      {visibleSteps.map((step, idx) => {
  const explanation = step.explanation || '';
  const equation = step.equation || '';

  // Split explanation by the equation (if it exists inside)
  const parts =
    equation && explanation.includes(equation)
      ? explanation.split(equation)
      : null;

  return (
    <View
      key={`${equation || idx}-${idx}`}
      style={{
        width: '95%',
        borderRadius: 14,
        paddingVertical: 24,
        paddingHorizontal: 20,
        // alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pickColor(idx),
        marginBottom: 14,
        elevation: 2,
        shadowColor: Colors.black,
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {/* Step number */}
      <Text
        style={{
          fontSize: 14,
          color: Colors.darkgray,
          marginBottom: 6,
          fontFamily: 'Roboto Regular',
        }}
      >
        Step {idx + 1}
      </Text>

      {/* Equation box content */}
      {parts ? (
        <Text
          style={{
            fontSize: 18,
            color: Colors.black,
            // textAlign: 'center',
            lineHeight: 26,
            fontFamily: 'AwanZaman Regular',
          }}
        >
          {parts[0]}
          <Text
            style={{
              fontFamily: 'Roboto Bold',
              color: Colors.black,
            }}
          >
            {equation}
          </Text>
          {parts[1]}
        </Text>
      ) : (
        <>
          {equation ? (
            <Text
              style={{
                fontSize: 22,
                color: Colors.black,
                fontFamily: 'Roboto Bold',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {equation}
            </Text>
          ) : null}

          {explanation ? (
            <Text
              style={{
                fontSize: 18,
                color: Colors.black,
                textAlign: 'center',
                lineHeight: 26,
                fontFamily: 'AwanZaman Regular',
              }}
            >
              {explanation}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
})}
{inputText && (
  <View
    style={{
      width: '95%',
      borderRadius: 20,
      backgroundColor: '#e6e6e6',
      padding: 16,
      marginVertical: 10,
    }}
  >
    <Text
      style={{
        fontSize: 18,
        color: Colors.black,
        fontFamily: 'AwanZaman Regular',
      }}
    >
      {inputText}
    </Text>
  </View>
)}

{/* ⏳ Activity Indicator */}
{showActivity && (
  <View style={{ marginVertical: 10 }}>
    <ActivityIndicator size="large" color={Colors.black} />
  </View>
)}

{/* 🎨 Final Answer Box */}
{showAnswer && (
  <View
    style={{
      width: '95%',
      borderRadius: 20,
      backgroundColor: pickColor(Math.floor(Math.random() * 6)),
      padding: 18,
      marginVertical: 10,
    }}
  >
    <Text
      style={{
        fontSize: 18,
        color: Colors.black,
        fontFamily: 'AwanZaman Regular',
        lineHeight: 26,
      }}
    >
      {finalAnswer}
    </Text>
  </View>
)}

      </ScrollView>

      {/* Explanation Area */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 60,
          backgroundColor: Colors.white,
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderTopWidth: 1,
          borderTopColor: '#ececec',
          borderTopLeftRadius:20,
          borderTopRightRadius:20,
          shadowColor: Colors.black,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,

          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 14, color: Colors.lightgray, marginBottom: 6 }}>
          Explanation:
        </Text>
        <Text style={{ fontSize: 18, color: '#111', lineHeight: 26 }}>
          {displayedText}
          <Text style={{ color: '#aaa' }}>
            {displayedWordsCount === 0 ? '' : ' ▍'}
          </Text>
        </Text>
      </View>

      {/* Mic + Keyboard UI */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:Colors.white
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
                paddingVertical: 5,
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
            onPress={isListening ? stopVoiceInput : startVoiceInput}
            disabled={isSpeaking}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              // backgroundColor: ,
              alignItems: 'center',
              justifyContent: 'center',
              bottom:5
            }}
          >
            {!isListening ? 
            <Ionicons name="mic-outline" size={30} style={{padding:15, borderColor:Colors.black, borderRadius:40, borderWidth:1}}/>
            :
            <Ionicons name="mic-off-outline" size={30} style={{padding:15, borderColor:Colors.black, borderRadius:40, borderWidth:1}}/>
            }
              {/* {isListening ? '🟢' : '🎤'} */}
            {/* </Text> */}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleKeyboardInput}
            disabled={isSpeaking}
            style={{
              position: 'absolute',
              right: 25,
              bottom: 12,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: Colors.white,
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


const SolutionScreen = ({ route, navigation }) => {
  const { imagePath, aiResponse, autoSpeak, base64Image } =
    route.params || {};

  const cancelRef = useRef(false);
  const [steps, setSteps] = useState([]);
  const { speak, stopTTS, isSpeaking } = useTTS();
  const modalRef = useRef(null);

  // const onOpenModal = () => modalRef.current?.openModal();

  useEffect(() => {
    if (!aiResponse) return;
    if (Array.isArray(aiResponse)) setSteps(aiResponse);
    else if (typeof aiResponse === 'object' && aiResponse.steps)
      setSteps(aiResponse.explanation);
    else setSteps([]);
  }, [aiResponse]);

  // AutoSpeak only if premium
  useEffect(() => {

  }, [autoSpeak, aiResponse]);



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Premium Mode */}
       
          <ComplexTutorView
            aiResponse={aiResponse}
            imagePath={imagePath}
            Colors={Colors}
            speak={speak}
            stopTTS={stopTTS}
            cancelRef={cancelRef}
            isSpeaking={isSpeaking}
          />

        {/* <TutorModal
          ref={modalRef}
          navigation={navigation}
          base64Image={base64Image}
          imagePath={imagePath} 
           onTutorSelect={(selectedMode) => setUsermode(selectedMode)}
        {/* /> */}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default SolutionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1, backgroundColor: '#f6f6f6ff', paddingTop: 20, paddingBottom: 200 },
  bannerContainer: {
    height: 120,
    width: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.white,
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
