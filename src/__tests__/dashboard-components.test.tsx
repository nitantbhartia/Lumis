import React from 'react';
import renderer from 'react-test-renderer';
import { MissionBriefingCard } from '../components/dashboard/MissionBriefingCard';
import { MorningLightSlider } from '../components/dashboard/MorningLightSlider';
import { ShieldCta } from '../components/dashboard/ShieldCta';

// Mock dependencies
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    RN.LayoutAnimation = {
        configureNext: jest.fn(),
        Presets: {
            spring: 'spring',
            linear: 'linear',
            easeInEaseOut: 'easeInEaseOut',
        },
    };
    return RN;
});

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
    notificationAsync: jest.fn(),
    NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-linear-gradient', () => ({
    LinearGradient: ({ children }: any) => children,
}));

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

describe('Dashboard Components', () => {
    it('MissionBriefingCard renders correctly', () => {
        const tree = renderer.create(
            <MissionBriefingCard
                mission={{
                    title: "Clear Sky Sprint",
                    message: "Test Message",
                    luxScore: "10,000+ Lux",
                    duration: "10-12 min",
                    durationValue: 12,
                    urgency: "Optimal",
                    urgencyColor: "#4CAF50",
                    isAdjusted: false
                }}
                windowStatus="OPTIMAL"
            />
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('MorningLightSlider renders correctly', () => {
        const tree = renderer.create(<MorningLightSlider goalMinutes={16} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('ShieldCta renders correctly', () => {
        const blockedApps = [
            { name: 'Instagram', isBlocked: true, id: 'instagram' },
        ];
        const tree = renderer.create(
            <ShieldCta
                onStartTracking={jest.fn()}
                onManageShield={jest.fn()}
                blockedApps={blockedApps}
                isCheckingLux={false}
                isGoalMet={false}
                progressPercent={50}
            />
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
