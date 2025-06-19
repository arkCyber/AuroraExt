import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from '~/pages/Login';
import Register from '~/pages/Register';

const AuthRoutes: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        console.log('=== Auth Routes Mounted ===');
        console.log('Current location:', {
            pathname: location.pathname,
            hash: location.hash,
            search: location.search,
            fullPath: window.location.href,
            isExtension: !!chrome?.extension,
            extensionId: chrome?.runtime?.id
        });

        // Debug: Check if we're in the correct route
        if (location.pathname === '/auth' || location.hash === '#/auth') {
            console.log('Auth route detected, rendering Login component');
        } else if (location.pathname === '/auth/register' || location.hash === '#/auth/register') {
            console.log('Register route detected, rendering Register component');
        }
    }, [location]);

    // Handle both direct paths and hash-based routing
    const renderRoutes = () => {
        console.log('Rendering auth routes with location:', location);

        return (
            <Routes>
                <Route index element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
        );
    };

    return renderRoutes();
};

export default AuthRoutes; 