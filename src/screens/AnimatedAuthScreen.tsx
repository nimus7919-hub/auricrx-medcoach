import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

const AnimatedAuthScreen = ({ onAuthSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const glowAnimation = new Animated.Value(0);
  const logoScale = new Animated.Value(0.8);
  const textOpacity = new Animated.Value(0);
  const slideUp = new Animated.Value(50);
  const titleGlow = new Animated.Value(0);

  useEffect(() => {
    // Start animations on mount
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow animation for logo
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    // Continuous glow animation for title
    const titleGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(titleGlow, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );
    titleGlowLoop.start();

    return () => {
      glowLoop.stop();
      titleGlowLoop.stop();
    };
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email, password);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await authService.signIn(email, password);
        Alert.alert('Success', 'Signed in successfully!');
      }
      onAuthSuccess();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    Alert.alert('Phone Authentication', 'Phone authentication will be implemented soon!');
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (result.success) {
        Alert.alert('Success', 'Signed in with Google successfully!');
        onAuthSuccess(result.user);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const glowColor = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFD700', '#FFA500'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const titleGlowColor = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFD700', '#FFA500'],
  });

  const titleGlowOpacity = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Background */}
        <View style={styles.background} />
        
        {/* Animated Logo */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            }
          ]}
        >
          <Animated.View
            style={[
              styles.logoGlow,
              {
                backgroundColor: glowColor,
                opacity: glowOpacity,
              }
            ]}
          />
          <View style={styles.logo}>
            <Text style={styles.logoText}>AR</Text>
            <View style={styles.pillIcon} />
          </View>
        </Animated.View>

        {/* Animated Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: slideUp }],
            }
          ]}
        >
          <Animated.Text style={[styles.title, { color: titleGlowColor }]}>
            AURIC RX
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { color: titleGlowColor }]}>
            AI & Health Checks
          </Animated.Text>
        </Animated.View>

        {/* Animated Form */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: slideUp }],
            }
          ]}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: glowColor }]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleAuth}>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} onPress={handlePhoneAuth}>
              <Text style={styles.socialButtonText}>Continue with Phone</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Legal Text */}
        <Animated.View
          style={[
            styles.legalContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: slideUp }],
            }
          ]}
        >
          <Text style={styles.legalText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    position: 'relative',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 2,
  },
  pillIcon: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 20,
    height: 8,
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    letterSpacing: 1,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  signInButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    alignItems: 'center',
    marginBottom: 30,
  },
  toggleText: {
    color: '#FFD700',
    fontSize: 14,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  legalContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  legalText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AnimatedAuthScreen;
