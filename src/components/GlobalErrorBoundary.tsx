import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { AlertCircle } from 'lucide-react-native';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[GlobalErrorBoundary] Uncaught error:', error, errorInfo);
        // Here you could also log to a service like Sentry or Bugsnag
    }

    handleRestart = () => {
        // Retry by resetting error state
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <AlertCircle size={64} color="#FF6B6B" style={{ marginBottom: 24 }} />

                        <Text style={styles.title}>Something went wrong</Text>

                        <Text style={styles.message}>
                            We encountered an unexpected error. Fret not, your data is safe.
                        </Text>

                        {this.state.error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText} numberOfLines={3}>
                                    {this.state.error.toString()}
                                </Text>
                            </View>
                        )}

                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                pressed && { opacity: 0.8 }
                            ]}
                            onPress={this.handleRestart}
                        >
                            <Text style={styles.buttonText}>Reload App</Text>
                        </Pressable>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#16213E',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#0F3460',
    },
    title: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold', // Assuming fonts are loaded, if not it will fallback
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#CCC',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    errorBox: {
        width: '100%',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    errorText: {
        fontSize: 12,
        color: '#FF6B6B',
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: '#FFB347',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#1A1A2E',
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        fontWeight: '600',
    }
});
