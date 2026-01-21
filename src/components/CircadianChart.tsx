import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withTiming,
    withDelay,
    FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 160;

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface CircadianChartProps {
    currentHour?: number;
}

export const CircadianChart: React.FC<CircadianChartProps> = ({
    currentHour = new Date().getHours() + new Date().getMinutes() / 60
}) => {
    // Generate points for a smooth circadian-like curve
    // Peak energy usually mid-morning, dip after lunch, peak early evening, low late night
    const generatePath = () => {
        const points = [];
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
            // Simple sine-like wave representing energy/light sensitivity
            // Peak at 10 AM (10) and 6 PM (18), valleys at 4 AM (4) and 3 PM (15)
            const x = (i / steps) * CHART_WIDTH;
            const normalizedHour = i;

            // Multi-weighted sine for a more realistic biological curve (Rise Science style)
            const energy = Math.sin((normalizedHour - 6) * (Math.PI / 12)) * 30 +
                Math.sin((normalizedHour - 14) * (Math.PI / 4)) * 10 + 60;

            points.push(`${i === 0 ? 'M' : 'L'} ${x} ${CHART_HEIGHT - energy}`);
        }
        return points.join(' ');
    };

    const currentX = (currentHour / 24) * CHART_WIDTH;
    const currentEnergy = Math.sin((currentHour - 6) * (Math.PI / 12)) * 30 +
        Math.sin((currentHour - 14) * (Math.PI / 4)) * 10 + 60;
    const currentY = CHART_HEIGHT - currentEnergy;

    return (
        <Animated.View entering={FadeIn.delay(400)} className="w-full px-6 mt-8">
            <View className="bg-white/5 rounded-[32px] p-6 border border-white/10 overflow-hidden">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lumis-dawn text-sm font-bold uppercase tracking-widest">Circadian Rhythm</Text>
                    <View className="bg-lumis-golden/20 px-3 py-1 rounded-full">
                        <Text className="text-lumis-golden text-[10px] font-black">HIGH SENSITIVITY</Text>
                    </View>
                </View>

                <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
                    <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
                        <Defs>
                            <LinearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.3" />
                                <Stop offset="0.4" stopColor="#FFB347" stopOpacity="0.8" />
                                <Stop offset="0.7" stopColor="#FF8C00" stopOpacity="0.6" />
                                <Stop offset="1" stopColor="#1E1B4B" stopOpacity="0.4" />
                            </LinearGradient>

                            <LinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#FFB347" stopOpacity="0.2" />
                                <Stop offset="1" stopColor="#FFB347" stopOpacity="0" />
                            </LinearGradient>
                        </Defs>

                        {/* Background Curve Fill */}
                        <Path
                            d={`${generatePath()} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`}
                            fill="url(#fillGradient)"
                        />

                        {/* Main Path */}
                        <Path
                            d={generatePath()}
                            stroke="url(#waveGradient)"
                            strokeWidth={4}
                            strokeLinecap="round"
                            fill="none"
                        />

                        {/* Current Time Indicator */}
                        <G>
                            <Circle cx={currentX} cy={currentY} r={8} fill="#FFB347" />
                            <Circle cx={currentX} cy={currentY} r={14} stroke="#FFB347" strokeWidth={1} opacity={0.4} />
                        </G>
                    </Svg>
                </View>

                <View className="flex-row justify-between mt-4">
                    <Text className="text-lumis-sunrise/30 text-[10px] font-bold">12 AM</Text>
                    <Text className="text-lumis-sunrise/30 text-[10px] font-bold">8 AM</Text>
                    <Text className="text-lumis-sunrise/30 text-[10px] font-bold">4 PM</Text>
                    <Text className="text-lumis-sunrise/30 text-[10px] font-bold">12 AM</Text>
                </View>
            </View>
        </Animated.View>
    );
};
