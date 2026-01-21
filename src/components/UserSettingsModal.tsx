import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Modal, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, LogOut, ChevronRight, Moon, Sun, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/state/auth-store';

const { width } = Dimensions.get('window');

interface UserSettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function UserSettingsModal({ visible, onClose }: UserSettingsModalProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const logout = useAuthStore((s) => s.logout);
    const userName = useAuthStore((s) => s.userName);

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        logout();
        onClose();
        router.replace('/onboarding-auth');
    };

    const MenuItem = ({ icon: Icon, label, value, onPress, showChevron = true, showSwitch = false, switchValue = false, onSwitchChange }: any) => (
        <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={onPress}
        >
            <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                    <Icon size={20} color="#1A1A2E" />
                </View>
                <Text style={styles.menuItemLabel}>{label}</Text>
            </View>

            {showSwitch ? (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchChange}
                    trackColor={{ false: '#E0E0E0', true: '#FFB347' }}
                    thumbColor={'#FFF'}
                />
            ) : (
                <View style={styles.menuItemRight}>
                    {value && <Text style={styles.menuItemValue}>{value}</Text>}
                    {showChevron && <ChevronRight size={20} color="#CCC" />}
                </View>
            )}
        </Pressable>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>

                    {/* Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#1A1A2E" />
                        </Pressable>
                    </View>

                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarTextLarge}>
                                {userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'NB'}
                            </Text>
                        </View>
                        <Text style={styles.profileName}>{userName || 'Nitant Bhartia'}</Text>
                        <Text style={styles.profileMeta}>Basic Plan</Text>
                    </View>

                    {/* Settings Groups */}
                    <View style={styles.menuGroup}>
                        <MenuItem
                            icon={Bell}
                            label="Notifications"
                            showSwitch
                            switchValue={notificationsEnabled}
                            onSwitchChange={(val: boolean) => {
                                Haptics.selectionAsync();
                                setNotificationsEnabled(val);
                            }}
                        />
                    </View>

                    <View style={styles.menuGroup}>
                        <MenuItem
                            icon={LogOut}
                            label="Log Out"
                            onPress={handleLogout}
                            showChevron={false}
                        />
                    </View>

                    <Text style={styles.versionText}>Lumis v1.0.0 (Build 42)</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#F2F2F7',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '60%',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#CCC',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    closeButton: {
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 16,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    avatarTextLarge: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    profileName: {
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
        marginBottom: 4,
    },
    profileMeta: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#999',
    },
    menuGroup: {
        backgroundColor: '#FFF',
        marginHorizontal: 24,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemPressed: {
        backgroundColor: '#F9F9F9',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemLabel: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#1A1A2E',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuItemValue: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#999',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#CCC',
        marginTop: 'auto',
        marginBottom: 20,
    },
});
