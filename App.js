import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Homescreen from './src/screens/Homescreen';
import AITutorAnimationScreen from './src/screens/AITutorAnimationScreen';
import Solutionscreen from './src/screens/Solutionscreen';

const Stack = createNativeStackNavigator();

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={Homescreen} />
          <Stack.Screen name="AITutorAnimation" component={AITutorAnimationScreen} />
          <Stack.Screen
            name="Solution"
            component={Solutionscreen}
            options={{ headerShown: true, headerTitleAlign: 'center' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;