import React, { useState, useEffect, useRef } from 'react';
import {
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  View,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Tts from 'react-native-tts';
import ImagePicker from 'react-native-image-crop-picker';
import OpenAI from 'openai';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import LottieView from 'lottie-react-native';

const Stack = createNativeStackNavigator();
const OPENAI_API_KEY = "Your_KEY";

const openAIClient = new OpenAI({
  baseURL: 'https://api.openai.com/v1/responses',
  apiKey: OPENAI_API_KEY,
});

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    Tts.getInitStatus()
      .then(() => console.log('TTS initialized'))
      .catch(err => console.error('TTS initialization failed', err));
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Stack.Navigator screenOptions={{ headerShown: false, }}>
          <Stack.Screen name="Home" component={AppContent} />
          <Stack.Screen name="AITutorAnimation" component={AITutorAnimationScreen} />
          <Stack.Screen name="Solution" component={SolutionScreen} options={{headerShown:true,headerTitleAlign: 'center'}} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function AppContent({ navigation }) {
  const scrollViewRef = useRef(null);
  const cancelRef = useRef(false);
  const [ImagePath, setImagePath] = useState('');
  const [base64Image, setbase64Image] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      Tts.stop();
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-progress');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    };
  }, []);

  const Texttospeech = async (content) => {
    cancelRef.current = false;
    setAiResponse(content);
    setCurrentWordIndex(-1);
    setIsPaused(false);
    const sentences = content.match(/[^.!?]+[.!?]*/g) || [content];
    let globalWordIndex = 0;
    Tts.stop();
    for (const sentence of sentences) {
      if (cancelRef.current) return;
      const words = sentence.split(/\s+/);
      Tts.setDefaultVoice('com.apple.ttsbundle.Moira-compact');
      Tts.speak(sentence);
      for (let i = 0; i < words.length; i++) {
        if (cancelRef.current) return;
        while (isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (cancelRef.current) return;
        }
        setCurrentWordIndex(globalWordIndex + i);
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(words[i].length * 80, 250))
        );
        if (cancelRef.current) return;
      }
      globalWordIndex += words.length;
      await new Promise((resolve) => setTimeout(resolve, sentence.length * 60 + 300));
    }
    Tts.stop();
    setCurrentWordIndex(-1);
  };

  async function SendRequestFn(query) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert tutor providing step-by-step solutions. Break down the solution into clear, numbered steps.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Provide a detailed step-by-step solution:' },
                { type: 'image_url', image_url: { url: `data:${query.mime};base64,${query.data}` } },
              ],
            },
          ],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const solution = data.choices[0].message.content;

      // const cleanedSolution = solution.replace(/^###\s*/gm, '').replace(/\\\\/g, '\\').trim();
 const cleanedSolution = solution
  .replace(/\\/g, '')
  .replace(/^#{1,6}\s*/gm, '')
  .replace(/(\*\*|__)(.*?)\1/g, '$2')
  .replace(/(\*|_)(.*?)\1/g, '$2')
  .replace(/`([^`]*)`/g, '$1')
  .replace(/\\\\/g, '\\')
  .replace(/\\n/g, '\n')
  .replace(/\\\(/g, '(')
  .replace(/\\\)/g, ')')
  .replace(/\n{2,}/g, '\n')
  .replace(/\s*:\s*/g, ': ')
  .replace(/\s*=\s*/g, ' = ')
  .trim();
      return cleanedSolution;
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return '';
    }
  }

  const ImagePickerFn = () => {
    Alert.alert('Select Image', 'Choose an option', [
      {
        text: 'Camera',
        onPress: () =>
          ImagePicker.openCamera({ cropping: true, includeBase64: true, freeStyleCropEnabled:true })
            .then(image => { setbase64Image(image); setImagePath(image.path); })
            .catch(error => console.log('Camera error:', error)),
      },
      {
        text: 'Gallery',
        onPress: () =>
          ImagePicker.openPicker({ cropping: true, includeBase64: true, freeStyleCropEnabled:true })
            .then(image => { setbase64Image(image); setImagePath(image.path); })
            .catch(error => console.log('Gallery error:', error)),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollviewstyle} ref={scrollViewRef}>
          <View style={styles.container}>
            <View style={styles.TopTextView}>
              <Text style={styles.TopText}>What do you want {'\n'} help with today?</Text>
              <Text style={styles.TopTextMessage}>Snap a photo or ask your AI tutor</Text>
            </View>

            <View style={styles.CenterImageView}>
              {ImagePath === '' ? (
                <LinearGradient style={styles.CenterImage} colors={['#5B63FF', '#367AFF']}>
                  <TouchableOpacity style={styles.CenterImage} onPress={() => ImagePickerFn()}>
                    <Ionicons name='camera-outline' size={100} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <>
                  <TouchableOpacity style={styles.CenterImageSelected} onPress={() => ImagePickerFn()}>
                    <Image source={{ uri: ImagePath }} style={{ width: 250, height: 200 }} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.Crossbtnview}
                    onPress={() => {
                      cancelRef.current = true;
                      setCurrentWordIndex(-1);
                      setAiResponse('');
                      setImagePath('');
                      Tts.stop();
                    }}>
                    <Ionicons name="close-circle-outline" size={35} color={'#000'} />
                  </TouchableOpacity>
                </>
              )}

              <LinearGradient style={styles.BottomBtnView} colors={['#5B63FF', '#2563EB']}>
                <TouchableOpacity onPress={() => {
                  navigation.navigate('AITutorAnimation', {
                    base64Image,
                    ImagePath,
                    SendRequestFn,
                  });
                }}>
                  <Text style={styles.BottomBtnText}>Ask AI Tutor</Text>
                </TouchableOpacity>
              </LinearGradient>
              
            </View>
               {/* <View style={styles.containerRecentSession}>
                <Text style={styles.title}>Recent Sessions</Text>
                <View style={styles.card}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="calculator-outline" size={24} color="#6B7280" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.subject}>Math</Text>
                    <Text style={styles.subtitle}>Solve 2x² - 3x + 4 = 0</Text>
                  </View>
                </View>
              </View> */}
          </View>
        </ScrollView>
      </SafeAreaView>


        <View style={styles.wrapper}>
          <View style={styles.Bottomcontainer}>
            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="home-outline" size={24} color="#2563EB" />
              <Text style={[styles.label, { color: '#2563EB' }]}>Home</Text>
              <View style={styles.dot} />
            </TouchableOpacity>

            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.centerButton}>
              <TouchableOpacity disabled activeOpacity={0.8} onPress={() => navigation.navigate('Solution', {
                imagePath: ImagePath,
                aiResponse: aiResponse
              })}>
                <Ionicons name="person-outline" size={26} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="person-outline" size={24} color="#9CA3AF" />
              <Text style={[styles.label, { color: '#9CA3AF' }]}>Solution</Text>
            </TouchableOpacity>
          </View>
        </View>
    
    </>
  );
}


// --- NEW SCREEN: AI Tutor Animation ---
function AITutorAnimationScreen({ route, navigation }) {
  const { base64Image, ImagePath, SendRequestFn } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.2, duration: 1000, easing: Easing.ease, useNativeDriver: true }),
      ])
    ).start();

    const fetchAIResponse = async () => {
      const response = await SendRequestFn(base64Image);
        const finalResponse = `Hello, let's look at this problem together.\n\n${response}`;
      navigation.replace('Solution', {
        imagePath: ImagePath,
        aiResponse: finalResponse,
        autoSpeak: true,
      });
    };

    setTimeout(fetchAIResponse, 1500);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <LottieView
        source={require('./assets/new.json')}
        autoPlay
        loop
        style={{ width: 150, height: 150 }}
      />
      <Animated.Text style={{ color: '#000', fontSize: 24, fontWeight: '700', opacity: fadeAnim, marginTop: 20 }}>
        Your AI Tutor is thinking...
      </Animated.Text>
      <Text style={{ color: '#000', fontSize: 16, marginTop: 10 }}>
        Analyzing your question and generating steps
      </Text>
    </View>
  );
}

 

// Solution Screen
function SolutionScreen({ route, navigation }) {
  const { imagePath, aiResponse, autoSpeak } = route.params || {};
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    return () => {
      Tts.stop();
      cancelRef.current = true;
      setCurrentWordIndex(-1);
    };
  }, []);

  useEffect(() => {
  if (autoSpeak && aiResponse) {
    const startTTS = async () => {
      try {
        await Tts.stop();
        await new Promise(resolve => setTimeout(resolve, 800)); // small delay after navigation
        TextToSpeech(aiResponse);
      } catch (err) {
        console.error('Auto TTS failed:', err);
      }
    };
    startTTS();
  }
}, [autoSpeak, aiResponse]);

  // Word-by-word speech
  const TextToSpeech = async (content) => {
    if (!content) return;

    cancelRef.current = false;
    setIsPaused(false);
    setCurrentWordIndex(-1);

    const sentences = content.match(/[^.!?]+[.!?]*/g) || [content];
    let globalWordIndex = 0;
    Tts.stop();

    for (const sentence of sentences) {
      if (cancelRef.current) return;
      const words = sentence.split(/\s+/);
      Tts.setDefaultVoice('com.apple.ttsbundle.Moira-compact');
      Tts.speak(sentence);

      for (let i = 0; i < words.length; i++) {
        if (cancelRef.current) return;
        while (isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (cancelRef.current) return;
        }
        setCurrentWordIndex(globalWordIndex + i);
        await new Promise((resolve) => setTimeout(resolve, Math.max(words[i].length * 80, 250)));
        if (cancelRef.current) return;
      }

      globalWordIndex += words.length;
      await new Promise((resolve) => setTimeout(resolve, sentence.length * 60 + 300));
      if (cancelRef.current) return;
    }

    setCurrentWordIndex(-1);
  };

  return (
    <SafeAreaView style={styles.profileContainer}>


      {imagePath ? (
        <Image
          source={{ uri: imagePath }}
          style={{ width: 300, height: 200, marginVertical: 20 }}
          resizeMode='contain'
        />
      ) : (
        <Text style={{ color: '#6B7280', marginVertical: 10 }}>No image selected</Text>
      )}

      {aiResponse ? (
        <ScrollView style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <StepFormattedText
            content={aiResponse}
            currentWordIndex={currentWordIndex}
          />
        </ScrollView>
      ) : (
        <Text style={{ color: '#9CA3AF' }}>No AI response yet</Text>
      )}

      {aiResponse ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
          {/* <TouchableOpacity
            style={[styles.goBackBtn, { backgroundColor: 'green', marginRight: 10 }]}
            onPress={() => {
              Tts.stop();
              TextToSpeech(aiResponse);
            }}
          >
            <Text style={styles.goBackText}>🔊 Speak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.goBackBtn, { backgroundColor: '#facc15', marginRight: 10 }]}
            onPress={() => setIsPaused((prev) => !prev)}
          >
            <Text style={[styles.goBackText, { color: '#000' }]}>
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.goBackBtn, { backgroundColor: 'red' }]}
            onPress={() => {
              cancelRef.current = true;
              Tts.stop();
              setCurrentWordIndex(-1);
            }}
          >
            <Text style={styles.goBackText}>🛑 Stop</Text>
          </TouchableOpacity>
        </View>
      ) : null}

 
      <View style={{marginBottom:20}}>

      </View>
    </SafeAreaView>
  );
}


const StepFormattedText = ({ content, currentWordIndex }) => {
  let cleaned = content.replace(/^###\s*/gm, '').replace(/\\\\/g, '\\');
  cleaned = cleaned.replace(/(\d+\.\s)/g, '\n$1');
  cleaned = cleaned.replace(/(Step\s*\d+[:.])/gi, '\n$1');
  const lines = cleaned.split('\n');

  const lightColors = [
    '#FCE7F3', '#E0F2FE', '#FEF9C3', '#DCFCE7',
    '#EDE9FE', '#FFF4E5', '#F3E8FF', '#E0F7FA'
  ];

  // Separate intro and steps
  const stepBlocks = [];
  let currentBlock = [];
  let introText = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const isStepStart = /^(Step\s*\d+[:.]|^\d+[.:])/i.test(trimmed);

    if (isStepStart) {
      if (currentBlock.length > 0) stepBlocks.push(currentBlock.join(' '));
      currentBlock = [trimmed];
    } else if (stepBlocks.length === 0 && currentBlock.length === 0) {
      introText.push(trimmed);
    } else {
      currentBlock.push(trimmed);
    }
  }
  if (currentBlock.length > 0) stepBlocks.push(currentBlock.join(' '));

  // Combine all content
  const allBlocks = [
    { type: 'intro', text: introText.join(' ') },
    ...stepBlocks.map((s, i) => ({ type: 'step', text: s, color: lightColors[i % lightColors.length] }))
  ];

  let globalWordIndex = 0;

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
      {allBlocks.map((block, index) => {
        if (!block.text) return null;

        const words = block.text.split(/\s+/);
        const stepMatch = block.text.match(/^(Step\s*\d+[:.]|^\d+[.:])/i);
        const stepLabel = stepMatch ? stepMatch[0] : null;
        const restOfText = stepLabel ? block.text.replace(stepLabel, '').trim() : block.text;

        if (block.type === 'intro') {
          // Highlight words from the intro
          return (
            <Text key={`intro-${index}`} style={{ fontSize: 16, lineHeight: 24, color: '#111', marginBottom: 14, flexWrap: 'wrap' }}>
              {words.map((word, wIndex) => {
                const currentIndex = globalWordIndex + wIndex;
                const isHighlighted = currentIndex === currentWordIndex;
                return (
                  <Text
                    key={`${index}-${wIndex}`}
                    style={{
                      backgroundColor: isHighlighted ? '#FFD54F' : 'transparent',
                      color: isHighlighted ? '#000' : '#111',
                    }}
                  >
                    {word + ' '}
                  </Text>
                );
              })}
              {(() => { globalWordIndex += words.length; return null; })()}
            </Text>
          );
        }

        // Step blocks
        return (
          <View
            key={`step-${index}`}
            style={{
              backgroundColor: block.color,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {stepLabel && (
              <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#111', marginBottom: 4 }}>
                {stepLabel}
              </Text>
            )}
            <Text style={{ fontSize: 16, lineHeight: 22, color: '#111', flexWrap: 'wrap' }}>
              {restOfText.split(/\s+/).map((word, wIndex) => {
                const currentIndex = globalWordIndex + wIndex;
                const isHighlighted = currentIndex === currentWordIndex;
                return (
                  <Text
                    key={`${index}-${wIndex}`}
                    style={{
                      backgroundColor: isHighlighted ? '#FFD54F' : 'transparent',
                      color: isHighlighted ? '#000' : '#111',
                    }}
                  >
                    {word + ' '}
                  </Text>
                );
              })}
              {(() => { globalWordIndex += restOfText.split(/\s+/).length; return null; })()}
            </Text>
          </View>
        );
      })}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollviewstyle: { paddingBottom: '30%' },
  TopTextView: { marginTop: '5%', justifyContent: 'center', alignItems: 'center' },
  TopText: { fontSize: 40 },
  TopTextMessage: { marginTop: 10, fontSize: 19, color: '#B3B9C3', fontWeight: '500' },
  CenterImageView: { marginTop: '20%', justifyContent: 'center', alignItems: 'center' },
  CenterImageSelected: { height: 200, width: 200, justifyContent: 'center', alignItems: 'center' },
  CenterImage: { borderRadius: 100, height: 200, width: 200, justifyContent: 'center', alignItems: 'center' },
  Crossbtnview: { position: 'absolute', top: 10, right: 40 },
  BottomBtnView: { marginTop: 30, justifyContent: 'center', alignItems: 'center', width: '50%', height: 60, borderRadius: 40 },
  BottomBtnText: { color: 'white', fontSize: 20 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(37,99,235,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 25, fontWeight: '500' },
  ResponseContainer: { width: '90%', backgroundColor: '#ededed', borderRadius: 20, marginBottom: '20%', justifyContent: 'center', alignSelf: 'center', marginTop: '15%' },
  solutionHeading: { margin: '5%', marginBottom: 2 },
  solutionText: { fontSize: 30, color: '#3B82F6', fontWeight: 'bold' },
  EmptyContainer: { marginBottom: '50%', justifyContent: 'space-evenly', flexDirection: 'row' },
  TTSplay: { backgroundColor: 'green', height: 50, width: 50, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  TTSpause: { backgroundColor: 'white', height: 50, width: 50, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  TTScancel: { backgroundColor: 'red', height: 50, width: 50, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  wrapper: { position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'center' },
  Bottomcontainer: { backgroundColor: '#fff', borderRadius: 40, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, width: '90%' },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  label: { fontSize: 12, marginTop: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2563EB', marginTop: 3 },
  centerButton: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, marginTop: -30 },
  containerRecentSession: { paddingHorizontal: 20, paddingVertical: 10, marginTop: '10%' },
  title: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, elevation: 2, marginBottom: '30%' },
  iconContainer: { backgroundColor: '#E5E7EB', borderRadius: 10, padding: 10, marginRight: 12 },
  textContainer: { flex: 1 },
  subject: { fontSize: 16, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  profileContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  profileTitle: { fontSize: 32, fontWeight: 'bold', color: '#2563EB' },
  goBackBtn: { marginTop: 20, backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  goBackText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default App;
