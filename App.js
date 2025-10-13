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
  Platform,
  ActivityIndicator
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import Tts from 'react-native-tts';
import ImagePicker from 'react-native-image-crop-picker';
import OpenAI from 'openai';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';

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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const scrollViewRef = useRef(null);
  const cancelRef = useRef(false);
 const [ImagePath, setImagePath] = useState('');
  const [base64Image, setbase64Image] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
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

  //  Highlight-enabled Text-to-Speech
  const Texttospeech = async (content) => {
    cancelRef.current = false;
    setAiResponse(content);
    setCurrentWordIndex(-1);
    setIsPaused(false);
    setIsCancelled(false);

    const sentences = content.match(/[^.!?]+[.!?]*/g) || [content];
    const allWords = content.split(/\s+/);
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
      if (cancelRef.current) return;
    }

    Tts.stop();
    setCurrentWordIndex(-1);
  };
// function Texttospeech(content){
//   Tts.speak(content)
//     setAiResponse(content);
// }

async function  SendRequest(query) {
  if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
 try {
    setIsLoading(true); // start loader at the top

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
            content: 'You are an expert tutor providing step-by-step solutions. Break down the solution into clear, numbered steps. Explain each step thoroughly but concisely. Use simple language. For mathematical expressions, use plain text notation (e.g., N2 + H2 → N2H4) instead of LaTeX. Avoid using \\text{} or other LaTeX commands. Format your response with clear line breaks between steps.'
          },
          {
            role: 'user',
            // content: `Provide a detailed step-by-step solution to this problem: ${image_url}`
            content: [
          {
            type: 'text',
            text: 'Provide a detailed step-by-step solution to this problem:'
          },
          {
            type:'image_url',
            image_url: {
              url: `data:${query.mime};base64,${query.data}`
            }
          }

            ]
          },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      setIsLoading(false)
      console.log('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const solution = data.choices[0].message.content;
    setIsLoading(false)
  const cleanedSolution = solution
  .replace(/^###\s*/gm, '')   // remove markdown headings
  .replace(/\\\\/g, '\\')     // fix double backslashes
  .trim();                    // remove leading/trailing spaces

     setIsLoading(false);
    setAiResponse(cleanedSolution);
    Texttospeech(cleanedSolution)
    scrollViewRef.current?.scrollToEnd({ animated: true });
    console.log('Solution generated successfully',solution);
 } catch (error) {
    console.error('OpenAI API error:', error);
    Alert.alert('Error', 'Something went wrong. Please try again.');
  } finally {
    // Always ensure loader stops even on error
    setIsLoading(false);
  }
}


const ImagePickerFn = () => {
  Alert.alert(
    'Select Image',
    'Choose an option',
    [
      {
        text: 'Camera',
        onPress: () => ImagePicker.openCamera({
          cropping: true,
          includeBase64:true,
          freeStyleCropEnabled:true
        }).then(image => {
          // convertImageToBase64(image)
          setbase64Image(image)
          setImagePath(image.path)
        }).catch(error => console.log('Camera error:', error)),
      },
      {
        text: 'Gallery',
        onPress: () => ImagePicker.openPicker({
          cropping: true,
          includeBase64:true,
          freeStyleCropEnabled:true
        }).then(image => {
          // convertImageToBase64(image)
          setbase64Image(image)
          setImagePath(image.path)
          // Handle image
        }).catch(error => console.log('Gallery error:', error)),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};


  return (
    <>
    <SafeAreaView style={styles.container}>
       {isLoading && (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(37,99,235,0.9)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text
          style={{
            color: '#fff',
            marginTop: 12,
            fontSize: 25,
            fontWeight: '500',
          }}>
          Getting AI Response...
        </Text>
      </View>
    )}

      <ScrollView style={styles.scrollviewstyle} ref={scrollViewRef}>
    <View style={styles.container}>
      <View style={styles.TopTextView}>
        <Text style={styles.TopText}>
          What do you want {'\n'} help with today?
        </Text>
        <Text style={styles.TopTextMessage}>
          Snap a photo or ask you AI tutor
        </Text>
        
        </View>
      <View style={styles.CenterImageView}>
        {ImagePath == ""?
      <LinearGradient style={styles.CenterImage} colors={['#5B63FF', '#367AFF']}>
        <TouchableOpacity style={styles.CenterImage} 
        onPress={()=>ImagePickerFn()}>
          <Ionicons name='camera-outline' size={100} color="#fff" iconType="solid" style={styles.CameraIcon}/>
          </TouchableOpacity>
          </LinearGradient>
          :
          <>
          {/* <LinearGradient style={styles.CenterImage} colors={['#5B63FF', '#367AFF']}> */}
        <TouchableOpacity style={styles.CenterImageSelected} 
        onPress={()=>ImagePickerFn()}>
          <Image     source={{ uri: ImagePath }}
      style={{ width: 200, height: 200 }} resizeMode='contain'/>
          </TouchableOpacity>

    <TouchableOpacity style={styles.Crossbtnview} onPress={()=> {
      cancelRef.current = true;
  setCurrentWordIndex(-1);
  setAiResponse("");
  setImagePath("");
  Tts.stop();
  }} >
    <Ionicons name="close-circle-outline" size={35} color={'#000'} />
    </TouchableOpacity>
    </>
        }

<LinearGradient style={styles.BottomBtnView} colors={['#5B63FF', '#2563EB']}>
          <TouchableOpacity 
        onPress={()=> {SendRequest(base64Image)}}>
          <Text style={styles.BottomBtnText}>
            Ask AI Tutor
          </Text>
          </TouchableOpacity>
          </LinearGradient>
      </View>

  
    {aiResponse !== ""?
      <>
     <View style={styles.ResponseContainer}>
        <View style={styles.solutionHeading}>
        <Text style={styles.solutionText}>
          Solution: {"\n"}
        </Text>
        </View>
        <StepFormattedText content={aiResponse} currentWordIndex={currentWordIndex} />
          {/* <Text style={styles.ResponseText}>
            {aiResponse.split(/\s+/).map((word, index) => (
                  <Text
                    key={index}
                    style={{
                      backgroundColor: index === currentWordIndex ? '#FFD54F' : 'transparent',
                      color: index === currentWordIndex ? '#000' : '#111',
                    }}
                  >
                    {word + ' '}
                  </Text>
                ))}
          </Text> */}
    </View>
      <View style={styles.EmptyContainer}>
        <TouchableOpacity style={styles.TTSplay} onPress={()=> {setIsPaused(false); Tts.resume();}} >
    <Ionicons name="caret-forward-circle-outline" size={35} color={'white'} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.TTSpause} onPress={()=> {setIsPaused(true); Tts.pause();}} >
    <Ionicons name="pause-circle-outline" size={35} color={'#000'} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.TTScancel} onPress={()=> {
       cancelRef.current = true;
  setCurrentWordIndex(-1);
  setAiResponse("");
  setImagePath("");
  Tts.stop();
      }} >
    <Ionicons name="close-circle-outline" size={35} color={'#fff'} />
    </TouchableOpacity>
    </View>
    </>
    :
    <View style={styles.containerRecentSession}>
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
    </View>
}
    </View>

  
    </ScrollView>

     <View style={styles.wrapper}>
      <View style={styles.Bottomcontainer}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#2563EB" />
          <Text style={[styles.label, { color: '#2563EB' }]}>Home</Text>
          <View style={styles.dot} />
        </TouchableOpacity>

        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.centerButton}
        >
          <TouchableOpacity activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={[styles.label, { color: '#9CA3AF' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>

    </SafeAreaView>
    </>
  );
}

// const StepFormattedText = ({ content }) => {
//   // Remove all ### and split lines
//   const lines = content.replace(/^###\s*/gm, '').split('\n');

//   return (
//     <View style={{ paddingHorizontal: '5%', paddingBottom: '5%' }}>
//       {lines.map((line, index) => {
//         const trimmed = line.trim();

//         // Bold any line starting with "Step" or "Final Expression"
//         if (/^(Step\s*\d+|Final Expression)/i.test(trimmed)) {
//           return (
//             <Text key={index} style={{ fontWeight: 'bold', fontSize: 18, marginTop: 8, color: '#000' }}>
//               {trimmed}
//             </Text>
//           );
//         }

//         // Regular lines
//         return (
//           <Text key={index} style={{ fontSize: 16, color: '#111', marginVertical: 2 }}>
//             {trimmed}
//           </Text>
//         );
//       })}
//     </View>
//   );
// };
const StepFormattedText = ({ content, currentWordIndex }) => {
  // 🧹 Clean up text: remove ### and fix \\ to \
  const cleaned = content.replace(/^###\s*/gm, '').replace(/\\\\/g, '\\');

  // Split by lines
  const lines = cleaned.split('\n');

  // Keep track of word index for highlighting
  let globalWordIndex = 0;

  return (
    <View style={{ paddingHorizontal: '5%', paddingBottom: '5%' }}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null; // skip empty lines

        // Split each line into words
        const words = trimmed.split(/\s+/);

        // Check if line is a heading
        const isStepLine = /^(Step\s*\d+|Final Expression)/i.test(trimmed);

        return (
          <Text
            key={index}
            style={{
              fontWeight: isStepLine ? 'bold' : 'normal',
              fontSize: isStepLine ? 18 : 16,
              marginTop: isStepLine ? 8 : 2,
              color: '#111',
              flexWrap: 'wrap',
            }}
          >
            {words.map((word, wordIndex) => {
              const currentIndex = globalWordIndex + wordIndex;
              const isHighlighted = currentIndex === currentWordIndex;

              return (
                <Text
                  key={`${index}-${wordIndex}`}
                  style={{
                    backgroundColor: isHighlighted ? '#FFD54F' : 'transparent',
                    color: isHighlighted ? '#000' : '#111',
                  }}
                >
                  {word + ' '}
                </Text>
              );
            })}

            {/* Increment the global word index after rendering each line */}
            {(() => {
              globalWordIndex += words.length;
              return null;
            })()}
          </Text>
        );
      })}
    </View>
  );
};





const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollviewstyle:{
    paddingBottom:'30%'
  },
  TopTextView:{
    marginTop:'5%',
    justifyContent:"center",
    alignItems:'center'
  },
  TopText:{
    fontSize:40
  },
   TopTextMessage:{ 
    marginTop:10,
    fontSize:19,
    color:'#B3B9C3',
    fontWeight:'500'
  },
  CenterImageView:{
    marginTop:'20%',
    justifyContent:"center",
    alignItems:'center',
  },
  CenterImageLinear:{

  },
  CenterImageSelected:{
    height:200,
    width:200,
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
  },
  CenterImage:{
    borderRadius:100,
    height:200,
    width:200,
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
  },
  CameraIcon:{

  },
  TextInputView:{
    height:'50%',
    width:'90%',
    backgroundColor:'#ededed',
    borderRadius:20
  },
  Crossbtnview:{
    position:'absolute',
    height:50,
    width:50,
    top:10,
    right:40,
    borderRadius:50,
    justifyContent:'center',
    alignItems:'center'
  },
  TTSplay:{
    // position:'absolute',
    backgroundColor:'green',
    height:50,
    width:50,
    borderRadius:50,
    justifyContent:'center',
    alignItems:'center'
  },
   TTSpause:{
    // position:'absolute',
    backgroundColor:'white',
    height:50,
    width:50,
    borderRadius:50,
    justifyContent:'center',
    alignItems:'center'
  },
   TTScancel:{
    // position:'absolute',
    backgroundColor:'red',
    height:50,
    width:50,
    borderRadius:50,
    justifyContent:'center',
    alignItems:'center'
  },
  BottomBtnView:{
    marginTop:'10%',
    justifyContent:"center",
    alignItems:'center',
    width:"50%",
    height:60,
    borderRadius:40,
    marginTop:30,
  },
  BottomBtnText:{
    color:'white',
    fontWeight:'regular',
    fontSize:20
  },
    wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
    navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginTop: 3,
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginTop: -30,
  },
    Bottomcontainer: {
    backgroundColor: '#fff',
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    width: '90%',
  },
    containerRecentSession: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop:"10%"
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom:'30%',
  },
  iconContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginRight: 12,
    
  },
  textContainer: {
    flex: 1,
  },
  subject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  ResponseContainer:{
    width:'90%',
    backgroundColor:'#ededed',
    borderRadius:20,
    marginBottom:'20%',
    justifyContent:'center',
    alignSelf:'center',
    marginTop:"15%"
  },
  solutionHeading:{
    height:40,
    margin:"5%",
    marginBottom:2
  }, 
  solutionText:{
    fontSize:30,
    color:'#3B82F6',
    fontWeight:'bold'
  },
  ResponseText:{
    fontSize:20,
    paddingHorizontal:"5%",
    paddingVertical:"5%"
  },
  EmptyContainer:{
        // height:'30%',
    marginBottom:'50%',
    justifyContent:'space-evenly',
    flexDirection:'row',
  }

});

export default App;
