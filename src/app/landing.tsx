import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  FadeIn,
  FadeInUp,
  FadeInDown,
  SlideInUp,
} from 'react-native-reanimated';
import {
  Sun,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Award,
  Clock,
  Smartphone,
  ChevronRight,
  Check,
  Star,
  Sparkles,
  Moon,
  Heart,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock device frame component for showcasing app screens
function DeviceMockup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={className}
      style={{
        width: 220,
        height: 440,
        backgroundColor: '#0A0A15',
        borderRadius: 36,
        padding: 8,
        borderWidth: 3,
        borderColor: '#2A2A45',
        shadowColor: '#FFB347',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
        elevation: 25,
      }}
    >
      {/* Notch */}
      <View
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          marginLeft: -40,
          width: 80,
          height: 24,
          backgroundColor: '#0A0A15',
          borderRadius: 12,
          zIndex: 10,
        }}
      />
      {/* Screen */}
      <View
        style={{
          flex: 1,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: '#1A1A2E',
        }}
      >
        {children}
      </View>
    </View>
  );
}

// Animated sun for hero section
function HeroSun() {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 80000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.2, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.3]) }],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.7]),
  }));

  const rays = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const size = 160;

  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow */}
      <Animated.View
        style={[
          glowStyle,
          {
            position: 'absolute',
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: size * 0.9,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 179, 71, 0.5)', 'rgba(255, 107, 53, 0.3)', 'transparent']}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size * 0.9,
          }}
        />
      </Animated.View>

      {/* Rays */}
      <Animated.View
        style={[
          raysStyle,
          {
            position: 'absolute',
            width: size * 1.6,
            height: size * 1.6,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {rays.map((angle) => (
          <View
            key={angle}
            style={{
              position: 'absolute',
              width: 3,
              height: size * 0.2,
              backgroundColor: '#FFB347',
              borderRadius: 2,
              transform: [{ rotate: `${angle}deg` }, { translateY: -size * 0.6 }],
              opacity: 0.5,
            }}
          />
        ))}
      </Animated.View>

      {/* Core sun */}
      <Animated.View style={coreStyle}>
        <LinearGradient
          colors={['#FFF8E7', '#FFB347', '#FF8C00', '#FF6B35']}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: '#FF8C00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 50,
            elevation: 30,
          }}
        />
      </Animated.View>
    </View>
  );
}

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(600).springify()}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
        style={{
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 228, 181, 0.15)',
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: 'rgba(255, 179, 71, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Icon size={28} color="#FFB347" strokeWidth={2} />
        </View>
        <Text
          style={{
            fontFamily: 'Syne_700Bold',
            fontSize: 20,
            color: '#FFF8E7',
            marginBottom: 8,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: 'Outfit_400Regular',
            fontSize: 15,
            color: '#FFE4B5',
            lineHeight: 22,
            opacity: 0.8,
          }}
        >
          {description}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

// Step component for "How it works"
function StepCard({
  number,
  title,
  description,
  icon: Icon,
  delay = 0,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(600).springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 32,
      }}
    >
      <LinearGradient
        colors={['#FFB347', '#FF8C00']}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Text
          style={{
            fontFamily: 'Syne_800ExtraBold',
            fontSize: 20,
            color: '#1A1A2E',
          }}
        >
          {number}
        </Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Icon size={20} color="#FFB347" strokeWidth={2} style={{ marginRight: 8 }} />
          <Text
            style={{
              fontFamily: 'Syne_700Bold',
              fontSize: 18,
              color: '#FFF8E7',
            }}
          >
            {title}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'Outfit_400Regular',
            fontSize: 15,
            color: '#FFE4B5',
            lineHeight: 22,
            opacity: 0.8,
          }}
        >
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

// Stat card
function StatCard({
  value,
  label,
  delay = 0,
}: {
  value: string;
  label: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(600).springify()}
      style={{
        alignItems: 'center',
        flex: 1,
      }}
    >
      <Text
        style={{
          fontFamily: 'Syne_800ExtraBold',
          fontSize: 36,
          color: '#FFB347',
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: 'Outfit_500Medium',
          fontSize: 13,
          color: '#FFE4B5',
          opacity: 0.7,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

// Testimonial component
function TestimonialCard({
  quote,
  author,
  role,
  delay = 0,
}: {
  quote: string;
  author: string;
  role: string;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(600).springify()}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
        style={{
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(139, 92, 246, 0.3)',
          marginRight: 16,
          width: 300,
        }}
      >
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={16} color="#FFB347" fill="#FFB347" style={{ marginRight: 4 }} />
          ))}
        </View>
        <Text
          style={{
            fontFamily: 'Outfit_400Regular',
            fontSize: 15,
            color: '#FFF8E7',
            lineHeight: 24,
            marginBottom: 16,
            fontStyle: 'italic',
          }}
        >
          "{quote}"
        </Text>
        <View>
          <Text
            style={{
              fontFamily: 'Outfit_600SemiBold',
              fontSize: 15,
              color: '#FFE4B5',
            }}
          >
            {author}
          </Text>
          <Text
            style={{
              fontFamily: 'Outfit_400Regular',
              fontSize: 13,
              color: '#FFE4B5',
              opacity: 0.6,
            }}
          >
            {role}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function LandingPage() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Waitlist submission mutation
  const waitlistMutation = useMutation({
    mutationFn: async (email: string) => {
      // Simulate API call - replace with real endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Waitlist signup:', email);
      return { success: true };
    },
    onSuccess: () => {
      setIsSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleSubmit = () => {
    if (email.includes('@') && email.includes('.')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      waitlistMutation.mutate(email);
    }
  };

  const features = [
    {
      icon: Sun,
      title: 'Smart Light Tracking',
      description:
        'Our advanced sensor technology measures natural daylight exposure in real-time, ensuring you get the light you need.',
    },
    {
      icon: Shield,
      title: 'App Shielding',
      description:
        'Lock distracting apps until you meet your daily light goal. Take control of your screen time naturally.',
    },
    {
      icon: TrendingUp,
      title: 'Gamified Progress',
      description:
        'Build streaks, earn achievements, and climb the leaderboard. Make healthy habits fun and engaging.',
    },
    {
      icon: Users,
      title: 'Social Motivation',
      description:
        'Connect with friends, share achievements, and motivate each other to get outside more.',
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Set Your Goal',
      description: 'Choose how much natural light exposure you want each day based on science-backed recommendations.',
      icon: Clock,
    },
    {
      number: 2,
      title: 'Shield Your Apps',
      description: 'Select which apps to lock until you meet your daily goal. Social media, games, streaming - you decide.',
      icon: Smartphone,
    },
    {
      number: 3,
      title: 'Go Outside',
      description: 'Get natural daylight while Lumis tracks your exposure using smart anti-spoofing verification.',
      icon: Sun,
    },
    {
      number: 4,
      title: 'Unlock & Thrive',
      description: 'Hit your goal to unlock your apps. Build streaks, earn rewards, and feel the difference.',
      icon: Zap,
    },
  ];

  const testimonials = [
    {
      quote: 'Lumis completely changed my morning routine. I actually look forward to getting outside now, and my mood has improved dramatically.',
      author: 'Sarah K.',
      role: 'Product Designer',
    },
    {
      quote: 'Finally, an app that helps me put down my phone without relying on willpower alone. The gamification makes it addictive in the best way.',
      author: 'Marcus T.',
      role: 'Software Engineer',
    },
    {
      quote: 'My screen time is down 40% since I started using Lumis. The streak system keeps me motivated every single day.',
      author: 'Emma L.',
      role: 'Graduate Student',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460', '#1A1A2E']}
          style={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 24,
            paddingBottom: 60,
            alignItems: 'center',
          }}
        >
          {/* Logo/Brand */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 48 }}
          >
            <LinearGradient
              colors={['#FFB347', '#FF8C00']}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Sun size={24} color="#1A1A2E" strokeWidth={2.5} />
            </LinearGradient>
            <Text
              style={{
                fontFamily: 'Syne_800ExtraBold',
                fontSize: 28,
                color: '#FFF8E7',
                letterSpacing: 1,
              }}
            >
              LUMIS
            </Text>
          </Animated.View>

          {/* Animated Sun */}
          <Animated.View entering={FadeIn.delay(400).duration(1000)}>
            <HeroSun />
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(800)}
            style={{ alignItems: 'center', marginTop: 32 }}
          >
            <Text
              style={{
                fontFamily: 'Syne_800ExtraBold',
                fontSize: 40,
                color: '#FFF8E7',
                textAlign: 'center',
                lineHeight: 48,
              }}
            >
              Earn Your{'\n'}Screen Time
            </Text>
            <Text
              style={{
                fontFamily: 'Outfit_500Medium',
                fontSize: 18,
                color: '#FFE4B5',
                textAlign: 'center',
                marginTop: 16,
                lineHeight: 28,
                opacity: 0.9,
                paddingHorizontal: 20,
              }}
            >
              Get natural daylight exposure before unlocking your favorite apps.
              Transform your mornings with science-backed wellness.
            </Text>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View
            entering={FadeInUp.delay(800).duration(600).springify()}
            style={{ marginTop: 32, width: '100%' }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <LinearGradient
                colors={['#FFB347', '#FF8C00', '#FF6B35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 18,
                  paddingHorizontal: 32,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF8C00',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Outfit_700Bold',
                    fontSize: 18,
                    color: '#1A1A2E',
                    marginRight: 8,
                  }}
                >
                  Join the Waitlist
                </Text>
                <ArrowRight size={20} color="#1A1A2E" strokeWidth={2.5} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <LinearGradient
            colors={['rgba(255, 179, 71, 0.1)', 'rgba(255, 107, 53, 0.05)']}
            style={{
              borderRadius: 24,
              padding: 28,
              flexDirection: 'row',
              borderWidth: 1,
              borderColor: 'rgba(255, 179, 71, 0.2)',
            }}
          >
            <StatCard value="10K+" label="Early Signups" delay={200} />
            <View style={{ width: 1, backgroundColor: 'rgba(255, 228, 181, 0.2)', marginHorizontal: 16 }} />
            <StatCard value="87%" label="Feel Happier" delay={400} />
            <View style={{ width: 1, backgroundColor: 'rgba(255, 228, 181, 0.2)', marginHorizontal: 16 }} />
            <StatCard value="2hrs" label="Less Screen" delay={600} />
          </LinearGradient>
        </View>

        {/* App Preview Section */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <Text
              style={{
                fontFamily: 'Syne_800ExtraBold',
                fontSize: 32,
                color: '#FFF8E7',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Beautiful & Intuitive
            </Text>
            <Text
              style={{
                fontFamily: 'Outfit_400Regular',
                fontSize: 16,
                color: '#FFE4B5',
                textAlign: 'center',
                opacity: 0.8,
                marginBottom: 32,
              }}
            >
              Designed for your daily wellness journey
            </Text>
          </Animated.View>

          {/* Device Mockups */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingVertical: 20,
            }}
            style={{ marginHorizontal: -24 }}
          >
            {/* Dashboard Screen */}
            <DeviceMockup className="mr-6">
              <LinearGradient
                colors={['#1A1A2E', '#16213E']}
                style={{ flex: 1, padding: 16, paddingTop: 40 }}
              >
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: '#FFE4B5', marginBottom: 4 }}>
                  Good Morning
                </Text>
                <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: '#FFF8E7', marginBottom: 16 }}>
                  Today's Goal
                </Text>
                {/* Progress Ring Mock */}
                <View style={{ alignItems: 'center', marginVertical: 16 }}>
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      borderWidth: 8,
                      borderColor: 'rgba(255, 179, 71, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        position: 'absolute',
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        borderWidth: 8,
                        borderColor: '#FFB347',
                        borderTopColor: 'transparent',
                        borderRightColor: 'transparent',
                        transform: [{ rotate: '45deg' }],
                      }}
                    />
                    <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 28, color: '#FFB347' }}>
                      12
                    </Text>
                    <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 10, color: '#FFE4B5' }}>
                      min left
                    </Text>
                  </View>
                </View>
                {/* Streak */}
                <View
                  style={{
                    backgroundColor: 'rgba(255, 179, 71, 0.15)',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={16} color="#FFB347" fill="#FFB347" />
                  <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#FFB347', marginLeft: 6 }}>
                    7 Day Streak!
                  </Text>
                </View>
              </LinearGradient>
            </DeviceMockup>

            {/* Tracking Screen */}
            <DeviceMockup className="mr-6">
              <LinearGradient
                colors={['#0F3460', '#1A1A2E']}
                style={{ flex: 1, padding: 16, paddingTop: 40 }}
              >
                <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 18, color: '#FFF8E7', textAlign: 'center', marginBottom: 8 }}>
                  Getting Sunlight
                </Text>
                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#FFE4B5', textAlign: 'center', opacity: 0.7, marginBottom: 24 }}>
                  Keep your phone in the light
                </Text>
                {/* Timer Mock */}
                <View style={{ alignItems: 'center', marginVertical: 24 }}>
                  <View
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      backgroundColor: 'rgba(255, 179, 71, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 4,
                      borderColor: '#FFB347',
                    }}
                  >
                    <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 36, color: '#FFF8E7' }}>
                      8:24
                    </Text>
                    <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 11, color: '#FFE4B5' }}>
                      remaining
                    </Text>
                  </View>
                </View>
                {/* Lux Meter */}
                <View
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#22C55E' }}>
                    Outdoor Light Detected
                  </Text>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 20, color: '#22C55E', marginTop: 4 }}>
                    12,450 lux
                  </Text>
                </View>
              </LinearGradient>
            </DeviceMockup>

            {/* Shield Screen */}
            <DeviceMockup className="mr-6">
              <LinearGradient
                colors={['#1A1A2E', '#16213E']}
                style={{ flex: 1, padding: 16, paddingTop: 40 }}
              >
                <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 18, color: '#FFF8E7', marginBottom: 16 }}>
                  Shielded Apps
                </Text>
                {/* App List Mock */}
                {['Instagram', 'TikTok', 'Twitter', 'YouTube'].map((app, i) => (
                  <View
                    key={app}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: ['#E1306C', '#000000', '#1DA1F2', '#FF0000'][i],
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Shield size={18} color="#FFF" />
                    </View>
                    <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 14, color: '#FFF8E7', flex: 1 }}>
                      {app}
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(255, 179, 71, 0.2)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 10, color: '#FFB347' }}>
                        Locked
                      </Text>
                    </View>
                  </View>
                ))}
              </LinearGradient>
            </DeviceMockup>

            {/* Achievements Screen */}
            <DeviceMockup>
              <LinearGradient
                colors={['#1A1A2E', '#0F3460']}
                style={{ flex: 1, padding: 16, paddingTop: 40 }}
              >
                <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 18, color: '#FFF8E7', marginBottom: 16 }}>
                  Achievements
                </Text>
                {/* Achievement Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { icon: Sun, label: 'First Light', color: '#FFB347' },
                    { icon: Zap, label: '7 Day Streak', color: '#8B5CF6' },
                    { icon: Award, label: '100 Hours', color: '#22C55E' },
                    { icon: Moon, label: 'Night Owl', color: '#3B82F6' },
                    { icon: Heart, label: 'Wellness', color: '#EF4444' },
                    { icon: Star, label: 'Perfect Week', color: '#F59E0B' },
                  ].map((achievement, i) => (
                    <View
                      key={i}
                      style={{
                        width: '30%',
                        aspectRatio: 1,
                        backgroundColor: `${achievement.color}15`,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: `${achievement.color}30`,
                      }}
                    >
                      <achievement.icon size={24} color={achievement.color} />
                      <Text
                        style={{
                          fontFamily: 'Outfit_500Medium',
                          fontSize: 8,
                          color: achievement.color,
                          marginTop: 4,
                          textAlign: 'center',
                        }}
                      >
                        {achievement.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </DeviceMockup>
          </ScrollView>
        </View>

        {/* Features Section */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <Text
              style={{
                fontFamily: 'Syne_800ExtraBold',
                fontSize: 32,
                color: '#FFF8E7',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Why Lumis?
            </Text>
            <Text
              style={{
                fontFamily: 'Outfit_400Regular',
                fontSize: 16,
                color: '#FFE4B5',
                textAlign: 'center',
                opacity: 0.8,
                marginBottom: 32,
                paddingHorizontal: 20,
              }}
            >
              Built on circadian science to help you reclaim your mornings
            </Text>
          </Animated.View>

          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={300 + index * 100}
            />
          ))}
        </View>

        {/* How It Works Section */}
        <LinearGradient
          colors={['rgba(15, 52, 96, 0.5)', 'transparent']}
          style={{ paddingHorizontal: 24, paddingVertical: 48 }}
        >
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <Text
              style={{
                fontFamily: 'Syne_800ExtraBold',
                fontSize: 32,
                color: '#FFF8E7',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              How It Works
            </Text>
            <Text
              style={{
                fontFamily: 'Outfit_400Regular',
                fontSize: 16,
                color: '#FFE4B5',
                textAlign: 'center',
                opacity: 0.8,
                marginBottom: 40,
              }}
            >
              Four simple steps to transform your routine
            </Text>
          </Animated.View>

          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              delay={300 + index * 100}
            />
          ))}
        </LinearGradient>

        {/* Testimonials Section */}
        <View style={{ paddingVertical: 40 }}>
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={{ paddingHorizontal: 24 }}>
            <Text
              style={{
                fontFamily: 'Syne_800ExtraBold',
                fontSize: 32,
                color: '#FFF8E7',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              What People Say
            </Text>
            <Text
              style={{
                fontFamily: 'Outfit_400Regular',
                fontSize: 16,
                color: '#FFE4B5',
                textAlign: 'center',
                opacity: 0.8,
                marginBottom: 32,
              }}
            >
              Join thousands improving their lives with Lumis
            </Text>
          </Animated.View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.author}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                delay={300 + index * 100}
              />
            ))}
          </ScrollView>
        </View>

        {/* Waitlist Section */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 48 }}>
          <LinearGradient
            colors={['rgba(255, 179, 71, 0.15)', 'rgba(255, 107, 53, 0.08)']}
            style={{
              borderRadius: 28,
              padding: 32,
              borderWidth: 1,
              borderColor: 'rgba(255, 179, 71, 0.3)',
            }}
          >
            <Animated.View entering={FadeInUp.delay(200).duration(600)}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: 'rgba(255, 179, 71, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Sparkles size={32} color="#FFB347" />
                </View>
                <Text
                  style={{
                    fontFamily: 'Syne_800ExtraBold',
                    fontSize: 28,
                    color: '#FFF8E7',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  Get Early Access
                </Text>
                <Text
                  style={{
                    fontFamily: 'Outfit_400Regular',
                    fontSize: 15,
                    color: '#FFE4B5',
                    textAlign: 'center',
                    opacity: 0.8,
                    lineHeight: 24,
                  }}
                >
                  Be first to experience Lumis. Join our waitlist and get notified when we launch.
                </Text>
              </View>

              {!isSubmitted ? (
                <View>
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 228, 181, 0.2)',
                      marginBottom: 16,
                    }}
                  >
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255, 228, 181, 0.4)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={{
                        fontFamily: 'Outfit_500Medium',
                        fontSize: 16,
                        color: '#FFF8E7',
                        padding: 18,
                      }}
                    />
                  </View>

                  <Pressable
                    onPress={handleSubmit}
                    disabled={waitlistMutation.isPending}
                    style={{ opacity: waitlistMutation.isPending ? 0.7 : 1 }}
                  >
                    <LinearGradient
                      colors={['#FFB347', '#FF8C00', '#FF6B35']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 18,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#FF8C00',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.4,
                        shadowRadius: 16,
                        elevation: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Outfit_700Bold',
                          fontSize: 17,
                          color: '#1A1A2E',
                        }}
                      >
                        {waitlistMutation.isPending ? 'Joining...' : 'Join Waitlist'}
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  <Text
                    style={{
                      fontFamily: 'Outfit_400Regular',
                      fontSize: 12,
                      color: '#FFE4B5',
                      textAlign: 'center',
                      opacity: 0.6,
                      marginTop: 12,
                    }}
                  >
                    No spam, ever. Unsubscribe anytime.
                  </Text>
                </View>
              ) : (
                <Animated.View
                  entering={FadeIn.duration(500)}
                  style={{ alignItems: 'center', paddingVertical: 16 }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Check size={32} color="#22C55E" strokeWidth={3} />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Syne_700Bold',
                      fontSize: 20,
                      color: '#22C55E',
                      marginBottom: 8,
                    }}
                  >
                    You're on the list!
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Outfit_400Regular',
                      fontSize: 15,
                      color: '#FFE4B5',
                      textAlign: 'center',
                      opacity: 0.8,
                    }}
                  >
                    We'll notify you when Lumis launches.
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 32,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 228, 181, 0.1)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <LinearGradient
              colors={['#FFB347', '#FF8C00']}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Sun size={18} color="#1A1A2E" strokeWidth={2.5} />
            </LinearGradient>
            <Text
              style={{
                fontFamily: 'Syne_700Bold',
                fontSize: 20,
                color: '#FFF8E7',
              }}
            >
              LUMIS
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Outfit_400Regular',
              fontSize: 13,
              color: '#FFE4B5',
              textAlign: 'center',
              opacity: 0.5,
              marginBottom: 16,
            }}
          >
            Earn your screen time with natural light
          </Text>
          <Text
            style={{
              fontFamily: 'Outfit_400Regular',
              fontSize: 12,
              color: '#FFE4B5',
              textAlign: 'center',
              opacity: 0.4,
            }}
          >
            © 2026 Lumis. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
