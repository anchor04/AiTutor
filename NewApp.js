import React, { useState, useEffect } from 'react';
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

const OPENAI_API_KEY = "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";

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
 const [ImagePath, setImagePath] = useState('');
  const [base64Image, setbase64Image] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    return () => {
      Tts.stop();
      Tts.removeAllListeners();
    };
  }, []);

  //  Highlight-enabled Text-to-Speech
  const Texttospeech = async (content) => {
    setAiResponse(content);
    setCurrentWordIndex(-1);
    setIsPaused(false);
    setIsCancelled(false);

    const sentences = content.match(/[^.!?]+[.!?]*/g) || [content];
    const allWords = content.split(/\s+/);
    let globalWordIndex = 0;

    Tts.stop();

    for (const sentence of sentences) {
      if (isCancelled) break;
      const words = sentence.split(/\s+/);
      Tts.speak(sentence);
      for (let i = 0; i < words.length; i++) {

        while (isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        if (isCancelled) break;

        setCurrentWordIndex(globalWordIndex + i);
        await new Promise((resolve) => {
          const duration = Math.max(words[i].length * 80, 250);
          setTimeout(resolve, duration);
        });
      }
      globalWordIndex += words.length;
      await new Promise((resolve) => setTimeout(resolve, sentence.length * 60 + 300));
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
      console.log('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const solution = data.choices[0].message.content;
    console.log(solution)
    Texttospeech(solution)
    console.log('Solution generated successfully',solution);

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
      <ScrollView style={styles.scrollviewstyle}>
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
          <LinearGradient style={styles.CenterImage} colors={['#5B63FF', '#367AFF']}>
        <TouchableOpacity style={styles.CenterImage} 
        onPress={()=>ImagePickerFn()}>
          <Image     source={{ uri: ImagePath }}
      style={{ width: 200, height: 200, borderRadius:100 }}/>
          </TouchableOpacity>
          </LinearGradient>
    <TouchableOpacity style={styles.Crossbtnview} onPress={()=> {setImagePath(""), setAiResponse("")}} >
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
    {aiResponse !== ""?
      <>

     <View style={styles.ResponseContainer}>
          <Text style={styles.ResponseText}>
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
          </Text>
    </View>
      <View style={styles.EmptyContainer}>
        <TouchableOpacity style={styles.TTSplay} onPress={()=> {setIsPaused(false); Tts.resume();}} >
    <Ionicons name="caret-forward-circle-outline" size={35} color={'white'} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.TTSpause} onPress={()=> {setIsPaused(true); Tts.pause();}} >
    <Ionicons name="pause-circle-outline" size={35} color={'#000'} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.TTScancel} onPress={()=> {setIsCancelled(true); Tts.stop(); setCurrentWordIndex(-1);}} >
    <Ionicons name="close-circle-outline" size={35} color={'#fff'} />
    </TouchableOpacity>
    </View>
    </>
    :
  null
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
