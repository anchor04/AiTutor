import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendToOpenAI } from '../utils/openai';
import useTTS from '../hooks/useTTS';
import Colors from '../../assets/colors';

const HomeScreen = ({ navigation }) => {
  const [imagePath, setImagePath] = useState('');
  const [base64Image, setBase64Image] = useState(null);
  const { stopTTS } = useTTS();
  const cancelRef = useRef(false);

  const pickImage = () => {
    Alert.alert('Select Image', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const img = await ImagePicker.openCamera({
              cropping: true,
              includeBase64: true,
              freeStyleCropEnabled: true,
            });
            setBase64Image(img);
            setImagePath(img.path);
          } catch (e) {
            console.warn('Camera cancelled');
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          try {
            const img = await ImagePicker.openPicker({
              cropping: true,
              includeBase64: true,
              freeStyleCropEnabled: true,
            });
            setBase64Image(img);
            setImagePath(img.path);
          } catch (e) {
            console.warn('Gallery cancelled');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const askAITutor = () => {
    if (!base64Image) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    navigation.navigate('AITutorAnimation', {
      base64Image,
      imagePath,
      sendToOpenAI,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>What do you want help with today?</Text>
        <Text style={styles.subtitle}>Snap a photo or ask your AI tutor</Text>

        <View style={styles.imageContainer}>
          {imagePath ? (
            <>
              <TouchableOpacity onPress={pickImage}>
                <Image source={{ uri: imagePath }} style={styles.imagePreview} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  cancelRef.current = true;
                  stopTTS();
                  setBase64Image(null);
                  setImagePath('');
                }}
              >
                <Ionicons name="close-circle-outline" size={35} color={Colors.black} />
              </TouchableOpacity>
            </>
          ) : (
            <LinearGradient colors={[Colors.themeblue1, Colors.themeblue2]} style={styles.imagePicker}>
              <TouchableOpacity onPress={pickImage}>
                <Ionicons name="camera-outline" size={100} color={Colors.white} />
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>

        <LinearGradient colors={[Colors.themeblue1, Colors.themeblue2]} style={styles.askButton}>
          <TouchableOpacity onPress={askAITutor}>
            <Text style={styles.askButtonText}>Ask AI Tutor</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { paddingTop:50, flex: 1, backgroundColor: Colors.white },
  content: { alignItems: 'center', paddingVertical: 20 },
  title: { fontSize: 36, textAlign: 'center', fontWeight: '700', color: Colors.black },
  subtitle: { fontSize: 18, color: Colors.lightgray, marginTop: 8 },
  imageContainer: { marginTop: 40, alignItems: 'center' },
  imagePicker: { height: 200, width: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  imagePreview: { height: 200, width: 250, resizeMode: 'contain' },
  closeButton: { position: 'absolute', top: 0, right: 20 },
  askButton: { marginTop: 30, borderRadius: 40, paddingVertical: 15, width: '60%', alignItems: 'center' },
  askButtonText: { color: Colors.white, fontSize: 20, fontWeight: '600' },
});