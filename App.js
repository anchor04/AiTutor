import React, { useState } from 'react';
import { StatusBar, ScrollView, StyleSheet,Text, TextInput, TouchableOpacity, useColorScheme,Image, View, Alert } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Tts from 'react-native-tts';
import ImagePicker from "react-native-image-crop-picker";
import OpenAI from "openai";
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import RNFS from 'react-native-fs';

 
      
let setAiResponse = "";
let base64Image = ""

const OPENAI_API_KEY= "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";

const openAIClient = new OpenAI({
  baseURL: 'https://api.openai.com/v1/responses',
  // baseURL: 'https://openrouter.ai/api/v1',

  apiKey: OPENAI_API_KEY,
});

function Texttospeech(content){
  Tts.speak(content)
  setTimeout(() => {
      base64Image = ""
  }, 1000);
}

   const convertImageToBase64 = async (imagePath) => {
        console.log(imagePath)
        console.log("imagePath")
      try {
        const base64 = await RNFS.readFile(imagePath.path, 'data');
        return base64;
      } catch (error) {
        console.error('Error converting image to base64:', error);
        return null;
      }
    };


async function  SendRequest(query) {
  if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    console.log(query)
    // console.log('Generating solution for problem:', query);
    // let image_url = { url: `data:image/jpeg;base64,${query}` }
    let image_url = { url: `data:image/jpg;base64,${query.data}` }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
            content: `what do you see in this image?: ${image_url}`
          },
        ],
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      // console.log('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const solution = data.choices[0].message.content;

    Texttospeech(solution)
    setAiResponse = solution;
    setTimeout(() => {
      setAiResponse != "" && setAiResponse != null
    }, 1000);

    // console.log('Solution generated successfully',solution);
    // console.log('Solution gene',image_url);
}


 function App() {

  const isDarkMode = useColorScheme() === 'dark';

 Tts.getInitStatus().then(() => {
      console.log('TTS initialized');
    }).catch(err => {
      console.error('TTS initialization failed', err);
    });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
const [ImagePath, setImagePath] = useState("");


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
          // console.log(image);
          // Handle image
          convertImageToBase64(image)
          base64Image = image.data
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
          convertImageToBase64(image)
          // console.log(image);
          base64Image = image.data
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
          <LinearGradient style={styles.CenterImage} colors={['#5B63FF', '#367AFF']}>
        <TouchableOpacity style={styles.CenterImage} 
        onPress={()=>ImagePickerFn()}>
          <Image     source={{ uri: ImagePath }}
      style={{ width: 200, height: 200, borderRadius:100 }}/>
          </TouchableOpacity>
          </LinearGradient>
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
    {setAiResponse != '' && setAiResponse != null?
    <>
     <View style={styles.ResponseContainer}>
          <Text style={styles.ResponseText}>
            {setAiResponse}
          </Text>
    </View>
      <View style={styles.EmptyContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollviewstyle:{
    paddingBottom:'30%'
  },
  TopTextView:{
    marginTop:'30%',
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
    backgroundColor:'white',
    height:30,
    width:30,
    top:20,
    right:10,
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
    alignSelf:'center'
  },
  ResponseText:{
    fontSize:20,
    paddingHorizontal:"5%",
    paddingVertical:"5%"
  },
  EmptyContainer:{
        // height:'30%',
    marginBottom:'20%',
  }

});

export default App;
