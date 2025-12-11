import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signOut as amplifySignOut, fetchAuthSession } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuthState = async () => {
        try {
            const currentUser = await getCurrentUser();
            const session = await fetchAuthSession();

            // Get user groups from Cognito
            const groups = session.tokens?.accessToken?.payload['cognito:groups'] || [];

            // Determine role based on groups
            let role = 'candidate'; // default role
            if (groups.includes('admin')) {
                role = 'admin';
            } else if (groups.includes('trainer')) {
                role = 'trainer';
            }

            setUser(currentUser);
            setUserRole(role);
        } catch (error) {
            setUser(null);
            setUserRole(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuthState();
    }, []);

    const signOut = async () => {
        try {
            await amplifySignOut();
            setUser(null);
            setUserRole(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const value = {
        user,
        userRole,
        loading,
        signOut,
        refreshAuth: checkAuthState
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
