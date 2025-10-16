import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Tts from 'react-native-tts';

export default function App() {
  const [solution, setSolution] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const scrollViewRef = useRef(null);

  // Clean and humanize the AI response
  const cleanResponse = (text) =>
    String(text || '')
      .replace(/\\/g, '') // remove backslashes
      .replace(/[│┃┆]/g, '') // remove box-drawing chars
      .replace(/^#{1,6}\s*/gm, '') // remove markdown headers
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\r/g, '')
      .replace(/\n{2,}/g, '\n')
      .trim();

  // --- Simulate AI call (replace with your actual API call) ---
  const fetchSolution = async (prompt) => {
    setIsLoading(true);
    // Replace this mock delay with your AI API call
    setTimeout(() => {
      const response = prompt; // for testing use provided text
      const cleaned = cleanResponse(response);
      setSolution(cleaned);
      setAiResponse(cleaned);
      setIsLoading(false);
    }, 2000);
  };

  // Automatically start TTS when we get a solution
  useEffect(() => {
    if (aiResponse) {
      const intro = "Hello, let's look at this problem together. ";
      const fullSpeech = intro + ' ' + aiResponse;
      speak(fullSpeech);
    }
  }, [aiResponse]);

  // --- TTS & highlighting ---
  const speak = (text) => {
    Tts.stop();
    const words = text.split(/\s+/);
    let index = 0;
    setCurrentWordIndex(0);
    Tts.speak(text);

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => {
        if (prev < words.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 250); // adjust speed
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      >
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
          AI Math Tutor
        </Text>

        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
            marginBottom: 12,
          }}
          placeholder="Type your math question..."
          multiline
          value={aiResponse ? '' : solution}
          onChangeText={setSolution}
        />

        <TouchableOpacity
          onPress={() => fetchSolution(solution)}
          style={{
            backgroundColor: '#1E3A8A',
            borderRadius: 8,
            padding: 12,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>Ask AI Tutor</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#1E3A8A" />
        ) : aiResponse ? (
          <StepFormattedText
            content={aiResponse}
            currentWordIndex={currentWordIndex}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- StepFormattedText Component ---
const StepFormattedText = ({ content, currentWordIndex }) => {
  const cleaned = String(content || '')
    .replace(/\\/g, '')
    .replace(/[│┃┆]/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\r/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  // 🌈 Light pastel colors for step boxes
  const lightColors = [
    '#FCE7F3',
    '#E0F2FE',
    '#FEF9C3',
    '#DCFCE7',
    '#EDE9FE',
    '#FFF4E5',
    '#F3E8FF',
    '#E0F7FA',
  ];
  const getColor = (i) => lightColors[i % lightColors.length];

  // 🧩 Split intro + steps robustly
  const normalized = cleaned
    .replace(/([^\n])\s+(?=Step\s*\d+[:.])/gi, '$1\n')
    .replace(/([^\n])\s+(?=\d+[.:]\s)/g, '$1\n')
    .replace(/:\s*(?=Step\s*\d+[:.])/gi, ':\n');

  const lines = normalized.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  const introLines = [];
  const stepBlocks = [];
  let currentBlock = [];
  const stepStartRegex = /^(?:Step\s*\d+[:.]|\d+[.:])/i;

  for (const line of lines) {
    if (stepStartRegex.test(line)) {
      if (currentBlock.length > 0) stepBlocks.push(currentBlock.join(' '));
      currentBlock = [line];
    } else {
      if (stepBlocks.length === 0 && currentBlock.length === 0)
        introLines.push(line);
      else currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) stepBlocks.push(currentBlock.join(' '));

  // 🧠 Render with word highlighting
  let globalWordIndex = 0;
  const renderWords = (text) => {
    const words = text.split(/\s+/).filter(Boolean);
    return words.map((word, idx) => {
      const isHighlight = globalWordIndex + idx === currentWordIndex;
      return (
        <Text
          key={`w-${globalWordIndex + idx}`}
          style={{
            backgroundColor: isHighlight ? '#FFE082' : 'transparent',
            color: '#111',
          }}
        >
          {word + ' '}
        </Text>
      );
    });
  };

  return (
    <View style={{ paddingBottom: 20 }}>
      {/* 📝 Intro text */}
      {introLines.length > 0 && (
        <Text
          style={{
            fontSize: 16,
            lineHeight: 24,
            color: '#111',
            marginBottom: 16,
          }}
        >
          {introLines.map((line, li) => {
            const parts = renderWords(line);
            globalWordIndex += line.split(/\s+/).filter(Boolean).length;
            return (
              <Text key={`intro-${li}`}>
                {parts}
                {'\n'}
              </Text>
            );
          })}
        </Text>
      )}

      {/* 🎨 Step boxes */}
      {stepBlocks.map((step, index) => {
        const color = getColor(index);
        const stepMatch = step.match(/^(Step\s*\d+[:.]|\d+[.:])/i);
        const stepLabel = stepMatch ? stepMatch[0] : '';
        const rest = stepLabel ? step.replace(stepLabel, '').trim() : step;

        const allWords = `${stepLabel} ${rest}`.split(/\s+/).filter(Boolean);

        return (
          <View
            key={`step-${index}`}
            style={{
              backgroundColor: color,
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 16, lineHeight: 22, color: '#111' }}>
              {allWords.map((word, i) => {
                const isHighlighted =
                  globalWordIndex + i === currentWordIndex;
                return (
                  <Text
                    key={`s-${index}-${i}`}
                    style={{
                      backgroundColor: isHighlighted
                        ? '#FFE082'
                        : 'transparent',
                      fontWeight: /^(Step|[0-9]+[:.]?$)/.test(word)
                        ? 'bold'
                        : 'normal',
                      color: '#111',
                    }}
                  >
                    {word + ' '}
                  </Text>
                );
              })}
            </Text>

            {(() => {
              globalWordIndex += allWords.length;
              return null;
            })()}
          </View>
        );
      })}
    </View>
  );
};
