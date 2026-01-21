import React from 'react';
import { useRouter } from 'expo-router';
import Dashboard from '../dashboard';

// This is the main tab - it renders the existing Dashboard component
export default function HomeTab() {
    return <Dashboard />;
}
