import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, X, Crown } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import {
    getOfferings,
    purchasePackage,
    restorePurchases,
} from '@/lib/revenuecatClient';
import { PurchasesPackage } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

const PREMIUM_FEATURES = [
    'Unlimited App Shields',
    'Extended Daily Goals (up to 60 min)',
    'Deep Analytics & Insights',
    'Streak Insurance (2 freezes/month)',
    'Live Activities & Widgets',
];

export default function PremiumTab() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const isPremium = useLumisStore((s) => s.isPremium);
    const setIsPremium = useLumisStore((s) => s.setIsPremium);
    const trialStartedAt = useLumisStore((s) => s.trialStartedAt);
    const startTrial = useLumisStore((s) => s.startTrial);
    const isTrialActive = useLumisStore((s) => s.isTrialActive());

    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

    const mockPackages: any[] = [
        {
            identifier: '$rc_lifetime',
            product: {
                priceString: '$79.99',
                price: 79.99,
                title: 'Lifetime',
            },
            packageType: 'LIFETIME',
        },
        {
            identifier: '$rc_annual',
            product: {
                priceString: '$39.99',
                price: 39.99,
                title: 'Yearly',
            },
            packageType: 'ANNUAL',
        },
        {
            identifier: '$rc_monthly',
            product: {
                priceString: '$7.99',
                price: 7.99,
                title: 'Monthly',
            },
            packageType: 'MONTHLY',
        }
    ];

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const result = await getOfferings();
            if (result.ok && result.data.current) {
                setPackages(result.data.current.availablePackages);
                // Default to lifetime if available, otherwise annual
                const lifetime = result.data.current.availablePackages.find(p => p.packageType === 'LIFETIME');
                const annual = result.data.current.availablePackages.find(p => p.packageType === 'ANNUAL');
                setSelectedPackage(lifetime || annual || result.data.current.availablePackages[0]);
            } else {
                setPackages(mockPackages);
                setSelectedPackage(mockPackages[0]); // Lifetime is first
            }
        } catch (e) {
            setPackages(mockPackages);
            setSelectedPackage(mockPackages[0]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!trialStartedAt) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            startTrial();
            Alert.alert('7-Day Trial Started!', 'Full access for 7 days. No card required.', [{ text: 'Awesome' }]);
            return;
        }

        if (!selectedPackage || purchasing) return;
        setPurchasing(true);

        try {
            if ((selectedPackage as any).offeringIdentifier) {
                const result = await purchasePackage(selectedPackage);
                if (result.ok && (result.data.entitlements.active['premium'] || result.data.entitlements.active['pro'])) {
                    setIsPremium(true);
                }
            } else {
                await new Promise(r => setTimeout(r, 1500));
                setIsPremium(true);
            }
        } catch (e) {
            Alert.alert('Error', 'Purchase could not be completed.');
        } finally {
            setPurchasing(false);
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace('/(tabs)');
    };

    const daysLeft = trialStartedAt ? 7 - Math.floor((new Date().getTime() - new Date(trialStartedAt).getTime()) / (1000 * 3600 * 24)) : 7;

    return (
        <View style={styles.container}>

            <View style={[styles.headerActions, { paddingTop: insets.top + 10 }]}>
                <Pressable
                    onPress={() => { }}
                    hitSlop={20}
                >
                    <Text style={styles.headerTextItem}>Redeem</Text>
                </Pressable>
                <Pressable
                    onPress={handleClose}
                    hitSlop={20}
                    style={styles.closeButtonContainer}
                >
                    <X size={26} color="rgba(26,26,46,0.5)" />
                </Pressable>
            </View>

            <View style={styles.mainContent}>
                <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
                    <View style={styles.iconCircle}>
                        <Crown size={28} color="#1A1A2E" />
                    </View>

                    <Text style={styles.title}>Science-Backed Light{'\n'}Exposure for Better Health</Text>

                    <View style={styles.featureList}>
                        {PREMIUM_FEATURES.map((feature, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(index * 80).duration(400)}
                                style={styles.featureItem}
                            >
                                <Check size={18} color="#1A1A2E" style={styles.checkIcon} strokeWidth={3} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>

                <View style={styles.optionsContainer}>
                    {packages.slice(0, 3).map((pkg) => {
                        const isSelected = selectedPackage?.identifier === pkg.identifier;
                        const isLifetime = pkg.packageType === 'LIFETIME';
                        const isAnnual = pkg.packageType === 'ANNUAL';

                        const getPriceLabel = () => {
                            if (isLifetime) return `${pkg.product.priceString} once`;
                            if (isAnnual) return `${pkg.product.priceString}/year • 3-day free trial`;
                            return `${pkg.product.priceString}/month • 7-day free trial`;
                        };

                        return (
                            <Pressable
                                key={pkg.identifier}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedPackage(pkg);
                                }}
                                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            >
                                {isLifetime && (
                                    <View style={[styles.bestValueBadge, { backgroundColor: '#7C3AED' }]}>
                                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                                    </View>
                                )}
                                {isAnnual && !isLifetime && (
                                    <View style={styles.bestValueBadge}>
                                        <Text style={styles.bestValueText}>POPULAR</Text>
                                    </View>
                                )}
                                <View style={styles.optionContent}>
                                    <View>
                                        <Text style={styles.optionTitle}>{pkg.product.title}</Text>
                                        <Text style={styles.optionPrice}>{getPriceLabel()}</Text>
                                    </View>
                                    {isSelected ? (
                                        <View style={styles.checkCircleActive}>
                                            <Check size={16} color="white" strokeWidth={4} />
                                        </View>
                                    ) : (
                                        <View style={styles.checkCircleInactive} />
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <Pressable onPress={handleSubscribe} disabled={purchasing} style={styles.subscribeBtn}>
                    <View style={styles.subscribeBtnBg}>
                        <Text style={styles.subscribeText}>
                            {trialStartedAt ? 'Upgrade Now' : 'Start your free trial'}
                        </Text>
                    </View>
                </Pressable>

                <Text style={styles.footerCancelText}>You can cancel your subscription at any time</Text>

                <View style={styles.footerLinks}>
                    <Pressable onPress={() => { }}><Text style={styles.linkText}>Restore</Text></Pressable>
                    <Pressable onPress={() => { }}><Text style={styles.linkText}>Privacy</Text></Pressable>
                    <Pressable onPress={() => { }}><Text style={styles.linkText}>Terms (EULA)</Text></Pressable>
                </View>
            </View>

            {isTrialActive && !isPremium && (
                <View style={[styles.trialBanner, { top: insets.top + 45 }]}>
                    <Text style={styles.trialBannerText}>TRIAL ACTIVE: {daysLeft} DAYS LEFT</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    headerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30, // Increased from 24 to pull away from edges
        zIndex: 10,
        height: 60,
        alignItems: 'center',
    },
    closeButtonContainer: {
        width: 44,
        height: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    headerTextItem: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    hero: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 24,
    },
    featureList: {
        alignSelf: 'flex-start',
        width: '100%',
        paddingLeft: 10,
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkIcon: {
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
        letterSpacing: 0.1,
    },
    optionsContainer: {
        gap: 12,
        marginTop: 20,
    },
    optionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: '#3B82F6',
    },
    bestValueBadge: {
        position: 'absolute',
        top: -10,
        right: 24,
        backgroundColor: '#FF8C00',
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 10,
    },
    bestValueText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 0.5,
    },
    optionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionTitle: {
        fontSize: 17,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    optionPrice: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Outfit_500Medium',
    },
    checkCircleActive: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleInactive: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    footer: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    subscribeBtn: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#FF6B35',
        marginBottom: 12,
    },
    subscribeBtnBg: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    subscribeText: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#FFF',
    },
    footerCancelText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        marginBottom: 12,
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 20,
    },
    linkText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
    },
    trialBanner: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#166534',
        paddingVertical: 3,
        alignItems: 'center',
    },
    trialBannerText: {
        color: 'white',
        fontSize: 9,
        fontFamily: 'Outfit_800ExtraBold',
    },
});
