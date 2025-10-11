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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import authService from '../services/authService';

const { width, height } = Dimensions.get('window');

const AnimatedAuthScreen = ({ onAuthSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Animation values
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


  const titleGlowColor = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D4AF37', '#B8860B'],
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
        

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: slideUp }],
              }
            ]}
          >
            {/* Header with Logo */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [{ scale: logoScale }],
                  }
                ]}
              >
                <View style={styles.logo}>
                  <Image 
                    source={require('../../assets/sign in logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </Animated.View>
              
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#D4AF37"
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
                  placeholderTextColor="#D4AF37"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* Primary Sign In Button */}
              <TouchableOpacity
                style={styles.signInButtonContainer}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706', '#F59E0B', '#FCD34D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.signInButton}
                >
                  <Text style={styles.signInButtonText}>
                    {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} onPress={handlePhoneAuth}>
                  <Text style={styles.socialIcon}>🍎</Text>
                  <Text style={styles.socialButtonText}>Continue with Apple</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleAuth}>
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>

              {/* Toggle Sign Up */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>

              {/* Legal Text */}
              <Text style={styles.legalText}>
                By signing in, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/** Animated top beam: slit + pulse + sweep */
function AnimatedTopBeam() {
  return (
    <View style={styles.topBeamContainer}>
      {/* narrow slit */}
      <View style={styles.slitLight} />
      {/* downward luminous beam */}
      <View style={styles.luminousBeam} />
      {/* sweeping sparkle */}
      <View style={styles.sweepingSparkle} />
    </View>
  );
}

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
  // Top Beam Animation
  topBeamContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  slitLight: {
    position: 'absolute',
    left: '7%',
    top: 8,
    height: 2,
    width: '86%',
    borderRadius: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.8,
  },
  luminousBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#D4AF37',
    opacity: 0.3,
  },
  sweepingSparkle: {
    position: 'absolute',
    top: 4,
    left: '50%',
    height: 40,
    width: 112,
    marginLeft: -56,
    backgroundColor: '#D4AF37',
    opacity: 0.4,
  },
  // Main Content
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 8,
  },
  // Form
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonContainer: {
    marginBottom: 20,
    borderRadius: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialContainer: {
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#F59E0B',
  },
  socialButtonText: {
    color: '#F59E0B',
    fontSize: 16,
  },
  toggleButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleText: {
    color: '#F59E0B',
    fontSize: 14,
  },
  legalText: {
    color: '#F59E0B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AnimatedAuthScreen;