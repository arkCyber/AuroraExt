import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthRoutes from './auth-routes';
import { OptionRouting } from './chrome-route';

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/auth/*" element={<AuthRoutes />} />
            <Route path="/*" element={<OptionRouting />} />
        </Routes>
    );
};

export default AppRoutes; 