import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Track tab - redirects to activity selection flow
export default function TrackTab() {
    const router = useRouter();

    useEffect(() => {
        // Navigate to activity selection when this tab is pressed
        router.push('/activity-selection');
    }, []);

    return null;
}
