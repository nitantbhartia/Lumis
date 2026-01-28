import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EditorialSlideProps {
  topText: string;
  bottomText: string;
  topColor: string;
  bottomColor: string;
  topTextColor?: string;
  bottomTextColor?: string;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}

export function EditorialSlide({
  topText,
  bottomText,
  topColor,
  bottomColor,
  topTextColor = '#FFFFFF',
  bottomTextColor = '#1A1A2E',
  index,
  scrollX,
  width,
}: EditorialSlideProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], 'clamp');
    const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], 'clamp');

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const topTextStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const translateY = interpolate(scrollX.value, inputRange, [30, 0, -30], 'clamp');

    return {
      transform: [{ translateY }],
    };
  });

  const bottomTextStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const translateY = interpolate(scrollX.value, inputRange, [20, 0, -20], 'clamp');

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View style={[styles.slide, { width }, animatedStyle]}>
      <View style={[styles.topSection, { backgroundColor: topColor }]}>
        <Animated.Text
          style={[styles.topText, { color: topTextColor }, topTextStyle]}
        >
          {topText}
        </Animated.Text>
      </View>
      <View style={[styles.bottomSection, { backgroundColor: bottomColor }]}>
        <Animated.Text
          style={[styles.bottomText, { color: bottomTextColor }, bottomTextStyle]}
        >
          {bottomText}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  topSection: {
    flex: 0.4,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  bottomSection: {
    flex: 0.6,
    justifyContent: 'flex-start',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  topText: {
    fontSize: 48,
    fontFamily: 'Outfit_800ExtraBold',
    lineHeight: 52,
    letterSpacing: -2,
  },
  bottomText: {
    fontSize: 24,
    fontFamily: 'Outfit_500Medium',
    lineHeight: 32,
  },
});
