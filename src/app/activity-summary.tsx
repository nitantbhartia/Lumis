import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Map as MapIcon, Share, Clock, Navigation, Zap, Footprints, Thermometer, Sun, Flame, Droplets } from 'lucide-react-native';
import MapView, { Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLumisStore } from '@/lib/state/lumis-store';

const { width } = Dimensions.get('window');

export default function ActivitySummaryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const lastSession = useLumisStore((s) => s.lastCompletedSession);
    const shareRef = useRef<View>(null);

    if (!lastSession) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>No activity found.</Text>
                <Pressable onPress={() => router.back()}><Text>Go Back</Text></Pressable>
            </View>
        );
    }

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const uri = await captureRef(shareRef, {
                format: 'png',
                quality: 0.8,
            });
            await Sharing.shareAsync(uri);
        } catch (e) {
            console.error('Sharing failed', e);
        }
    };

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const activityTypeLabel = lastSession.type.toUpperCase();
    const dateStr = new Date(lastSession.startTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).toUpperCase();
    const timeStr = new Date(lastSession.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });

    // Calculate region from coordinates
    const initialRegion = lastSession.coordinates.length > 0 ? {
        latitude: lastSession.coordinates[0].latitude,
        longitude: lastSession.coordinates[0].longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    } : {
        latitude: 32.7157,
        longitude: -117.1611,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <View style={[styles.container, { backgroundColor: '#FFF' }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
                <View ref={shareRef} style={{ backgroundColor: '#FFF' }}>
                    {/* Header */}
                    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconCircle}>
                                <Navigation size={20} color="#1A1A2E" />
                            </View>
                            <View>
                                <View style={styles.titleRow}>
                                    <Text style={styles.title}>Daylight Exposure</Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{activityTypeLabel}</Text>
                                    </View>
                                </View>
                                <Text style={styles.dateTime}>{dateStr} AT {timeStr}</Text>
                            </View>
                        </View>
                        <Pressable onPress={() => router.back()} style={styles.closeButton}>
                            <X size={24} color="#1A1A2E" />
                        </Pressable>
                    </View>

                    {/* Map Section */}
                    <View style={styles.mapContainer}>
                        <MapView
                            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                            style={styles.map}
                            initialRegion={initialRegion}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            pitchEnabled={false}
                            rotateEnabled={false}
                        >
                            <Polyline
                                coordinates={lastSession.coordinates}
                                strokeColor="#FF8C00"
                                strokeWidth={3}
                            />
                        </MapView>
                    </View>

                    {/* Main Metrics */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metricItemLarge}>
                            <View style={styles.metricHeaderLarge}>
                                <Text style={styles.metricValueLarge}>{formatDuration(lastSession.durationSeconds)}</Text>
                                <Clock size={20} color="#1A1A2E" />
                            </View>
                            <Text style={styles.metricLabelLarge}>TIME</Text>
                        </View>
                        <View style={styles.metricItemLarge}>
                            <View style={styles.metricHeaderLarge}>
                                <Text style={styles.metricValueLarge}>{lastSession.distance}</Text>
                                <Text style={styles.metricUnitLarge}>mi</Text>
                            </View>
                            <Text style={styles.metricLabelLarge}>DISTANCE</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Lux/Steps Row */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metricItemMedium}>
                            <View style={styles.metricIconWrap}>
                                <Sun size={20} color="#1A1A2E" />
                            </View>
                            <View>
                                <Text style={styles.metricValueMedium}>{Math.round(lastSession.lux)}</Text>
                                <Text style={styles.metricLabelMedium}>LUX</Text>
                            </View>
                        </View>
                        <View style={styles.metricItemMedium}>
                            <View style={styles.metricIconWrap}>
                                <Footprints size={20} color="#1A1A2E" strokeWidth={1.5} />
                            </View>
                            <View>
                                <Text style={styles.metricValueMedium}>{lastSession.steps}</Text>
                                <Text style={styles.metricLabelMedium}>STEPS</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Grid of details */}
                    <View style={styles.grid}>
                        <View style={styles.gridItem}>
                            <Droplets size={16} color="#1A1A2E" />
                            <Text style={styles.gridValue}>{lastSession.uvIndex}</Text>
                            <Text style={styles.gridLabel}>UV INDEX</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Thermometer size={16} color="#1A1A2E" />
                            <Text style={styles.gridValue}>{lastSession.temperature}°C</Text>
                            <Text style={styles.gridLabel}>TEMPERATURE</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Flame size={16} color="#1A1A2E" />
                            <Text style={styles.gridValue}>{lastSession.calories}</Text>
                            <Text style={styles.gridLabel}>CALORIES</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Sun size={16} color="#1A1A2E" />
                            <Text style={styles.gridValue}>{lastSession.vitaminD} IU</Text>
                            <Text style={styles.gridLabel}>VITAMIN D</Text>
                        </View>
                    </View>
                </View>

                {/* Share Button */}
                <View style={styles.footer}>
                    <Pressable onPress={handleShare}>
                        <LinearGradient
                            colors={['#FFD580', '#FF8C00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.shareButton}
                        >
                            <Text style={styles.shareButtonText}>Share Activity</Text>
                        </LinearGradient>
                    </Pressable>
                    <Pressable style={styles.moreButton}>
                        <Text style={styles.moreText}>More</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
    badge: {
        backgroundColor: '#FF8C00',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
    },
    dateTime: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#999',
        marginTop: 2,
    },
    closeButton: {
        padding: 8,
    },
    mapContainer: {
        width: width - 48,
        height: width - 80,
        marginHorizontal: 24,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
        marginBottom: 24,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    metricsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 24,
    },
    metricItemLarge: {
        flex: 1,
    },
    metricHeaderLarge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    metricValueLarge: {
        fontSize: 48,
        fontFamily: 'Outfit_300Light',
        color: '#101010',
    },
    metricUnitLarge: {
        fontSize: 20,
        fontFamily: 'Outfit_300Light',
        color: '#AAA',
    },
    metricLabelLarge: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        color: '#AAA',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 24,
        marginVertical: 16,
    },
    metricItemMedium: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metricIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricValueMedium: {
        fontSize: 28,
        fontFamily: 'Outfit_400Regular',
        color: '#1A1A2E',
    },
    metricLabelMedium: {
        fontSize: 10,
        fontFamily: 'Outfit_600SemiBold',
        color: '#AAA',
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingBottom: 24,
    },
    gridItem: {
        alignItems: 'center',
    },
    gridValue: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
        marginTop: 4,
    },
    gridLabel: {
        fontSize: 8,
        fontFamily: 'Outfit_700Bold',
        color: '#AAA',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    footer: {
        paddingHorizontal: 24,
        marginTop: 20,
    },
    shareButton: {
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
    },
    moreButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    moreText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#007AFF',
    },
});
