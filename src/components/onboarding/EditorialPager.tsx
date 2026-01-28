import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { EditorialSlide } from './EditorialSlide';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SlideData {
  topText: string;
  bottomText: string;
  topColor: string;
  bottomColor: string;
  topTextColor?: string;
  bottomTextColor?: string;
}

interface EditorialPagerProps {
  slides: SlideData[];
  onComplete: () => void;
  autoAdvanceDelay?: number;
}

export function EditorialPager({
  slides,
  onComplete,
  autoAdvanceDelay = 2500,
}: EditorialPagerProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateIndex = (index: number) => {
    setCurrentIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      runOnJS(updateIndex)(index);
    },
  });

  // Auto-advance functionality
  useEffect(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    if (currentIndex < slides.length - 1) {
      autoAdvanceTimer.current = setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: (currentIndex + 1) * SCREEN_WIDTH,
          animated: true,
        });
        setCurrentIndex(currentIndex + 1);
      }, autoAdvanceDelay);
    }

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [currentIndex, slides.length, autoAdvanceDelay]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <EditorialSlide
            key={index}
            index={index}
            scrollX={scrollX}
            width={SCREEN_WIDTH}
            {...slide}
          />
        ))}
      </Animated.ScrollView>

      {/* Page Indicator & Button Container */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {/* Page Indicators */}
        <View style={styles.indicators}>
          {slides.map((_, index) => (
            <PageIndicator
              key={index}
              index={index}
              scrollX={scrollX}
              width={SCREEN_WIDTH}
            />
          ))}
        </View>

        {/* Continue Button - only show on last slide */}
        {isLastSlide && (
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>That's me</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface PageIndicatorProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
  width: number;
}

function PageIndicator({ index, scrollX, width }: PageIndicatorProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], 'clamp');
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], 'clamp');

    return {
      width: dotWidth,
      opacity,
    };
  });

  return <Animated.View style={[styles.indicator, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    gap: 24,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 0,
    paddingVertical: 20,
    alignItems: 'center',
    marginHorizontal: -32,
  },
  buttonPressed: {
    backgroundColor: '#E85D04',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
