import React from 'react';
import renderer from 'react-test-renderer';
import { MissionBriefingCard } from '../components/dashboard/MissionBriefingCard';
import { DaylightBar } from '../components/dashboard/DaylightBar';
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
                weatherCondition="Clear"
                hoursSinceSunrise={2}
                streak={5}
                userName="Nitant"
            />
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('DaylightBar renders correctly', () => {
        const tree = renderer.create(<DaylightBar />).toJSON();
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
