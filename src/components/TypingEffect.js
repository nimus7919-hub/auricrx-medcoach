import React, { useState, useEffect, useRef } from 'react';
import { Text, Animated } from 'react-native';

export default function TypingEffect({ 
  text, 
  speed = 30, 
  onComplete, 
  style,
  showCursor = true 
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    setCurrentIndex(0);

    const typeInterval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        if (prevIndex < text.length) {
          setDisplayedText(text.substring(0, prevIndex + 1));
          return prevIndex + 1;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          if (onComplete) onComplete();
          return prevIndex;
        }
      });
    }, speed);

    return () => clearInterval(typeInterval);
  }, [text, speed, onComplete]);

  // Cursor blinking animation
  useEffect(() => {
    if (!showCursor || !isTyping) return;

    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();

    return () => blink.stop();
  }, [isTyping, showCursor, cursorOpacity]);

  return (
    <Text style={style}>
      {displayedText}
      {showCursor && isTyping && (
        <Animated.Text style={{ opacity: cursorOpacity }}>|</Animated.Text>
      )}
    </Text>
  );
}
