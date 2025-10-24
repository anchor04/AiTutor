// src/screens/AITutorAnimationScreen.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, Animated, Easing, StyleSheet, Alert } from "react-native";
import LottieView from "lottie-react-native";
import Colors from '../../assets/colors'

const AITutorAnimationScreen = ({ route, navigation }) => {
  const { base64Image, imagePath, sendToOpenAI } = route.params || {};
  const glassLottieRef = useRef(null);

  // Animated values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageTranslateY = useRef(new Animated.Value(40)).current;
  const imageTranslateX = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const fadeAnalyzingText = useRef(new Animated.Value(0)).current;
  const fadeBottomRow = useRef(new Animated.Value(0)).current;
  const bottomRowTranslateY = useRef(new Animated.Value(0)).current;
  const lottie1Opacity = useRef(new Animated.Value(0)).current;

  // Typing effect
  const [typedText, setTypedText] = useState("");
  const fullIntroText = "Now, let’s dive into your question.";
  const [showIntro, setShowIntro] = useState(true);

  const timers = useRef([]);

  useEffect(() => {
    // Step 0 — Fade in container
    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Step 1 — Letter-by-letter typing
    let index = 0;
    const typeNext = () => {
      if (index <= fullIntroText.length) {
        setTypedText(fullIntroText.slice(0, index));
        index++;
        const t = setTimeout(typeNext, 25);
        timers.current.push(t);
      } else {
        // When typing finishes, start the image animation
        startImageAnimation();
      }
    };
    typeNext();

    // Step 4 — Show "Preparing your session"
    const tPhase2 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(lottie1Opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnalyzingText, {
          toValue: 0.25,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(imageOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(bottomRowTranslateY, {
          toValue: -150,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(fadeBottomRow, {
          toValue: 1,
          duration: 800,
          delay: 400,
          useNativeDriver: false,
        }),
      ]).start();
    }, 8200);
    timers.current.push(tPhase2);

    // Step 5 — Navigate
    const tNav = setTimeout(() => {
      fetchAndNavigate();
    }, 10200);
    timers.current.push(tNav);

    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, []);

  // Step 2 — Image animation sequence
  const startImageAnimation = () => {
    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(imageTranslateY, {
        toValue: -10,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      // After the fade-in completes, shrink & move left
      Animated.parallel([
        Animated.timing(imageScale, {
          toValue: 0.6,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(imageTranslateX, {
          toValue: -40,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        // When image animation finishes, hide intro and show analyzing
        setShowIntro(false);
        showAnalyzingSection();
      });
    });
  };

  // Step 3 — Fade in "Analyzing question"
  const showAnalyzingSection = () => {
    Animated.parallel([
      Animated.timing(fadeAnalyzingText, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(lottie1Opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const fetchAndNavigate = async () => {
    try {
      if (typeof sendToOpenAI === "function") {
      
        const response = await sendToOpenAI(base64Image || imagePath);
        const aiResponse =
          typeof response === "string" ? response : JSON.stringify(response);
            console.log(response)
        navigation.replace("Solution", { imagePath,base64Image , aiResponse, autoSpeak: false, aiResponse: response.steps, finalAnswer: response.finalAnswer,});
      } else {
        // console.log('2')
        // navigation.replace("Solution", {
        //   imagePath,
        //   aiResponse: "",
        //   autoSpeak: true,
        //   base64Image
        // });
      }
    } catch {
          //       navigation.replace("Solution", {
          // imagePath,
          // ShowScreen: 'normal',
          // base64Image,
        //   ShowScreen: 'complex',
        //   autoSpeak: true,
                // })

    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* --- INTRO TEXT / ANALYZING QUESTION --- */}
      <View style={styles.topTextContainer}>
        {showIntro ? (
          <Text style={styles.introText}>{typedText}</Text>
        ) : (
          <Animated.View style={[styles.row, { opacity: fadeAnalyzingText }]}>
            <View style={styles.iconWrapper}>
              <Animated.View style={{ opacity: lottie1Opacity }}>
                <LottieView
                  ref={glassLottieRef}
                  source={require("../../assets/glassnew.json")}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
              </Animated.View>
            </View>
            <Text style={styles.titleText}>Analyzing question</Text>
          </Animated.View>
        )}
      </View>

      {/* --- IMAGE --- */}
      <Animated.View
        style={[
          styles.imageWrapper,
          {
            opacity: imageOpacity,
            transform: [
              { translateY: imageTranslateY },
              { translateX: imageTranslateX },
              { scale: imageScale },
            ],
            alignSelf: "center",
          },
        ]}
      >
        {imagePath ? (
          <Image source={{ uri: imagePath }} style={styles.thumbnail} resizeMode="cover" />
        ) : base64Image ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${base64Image}` }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholder]} />
        )}
      </Animated.View>

      {/* --- BOTTOM ROW ("Preparing your session") --- */}
      <Animated.View
        style={[
          styles.row,
          { opacity: fadeBottomRow, transform: [{ translateY: bottomRowTranslateY }] },
        ]}
      >
        <LottieView
          source={require("../../assets/atomic.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.phase2Text}>Preparing your session</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default AITutorAnimationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 28,
    paddingTop: 50,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  topTextContainer: {
    minHeight: 50,
    justifyContent: "center",
  },
  introText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    // height: 50,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    // height: 50,
  },
  imageWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginTop: 5,
  },
  thumbnail: {
    width: 250,
    height: 125,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: 50,
    height: 50,
    // marginRight: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
  },
  phase2Text: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.black,
  },
});
