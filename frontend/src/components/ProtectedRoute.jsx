import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        // Redirect to their appropriate dashboard if they have the wrong role
        return <Navigate to={user.role === 'donor' ? '/donor' : '/ngo'} replace />;
    }

    return children;
};

export default ProtectedRoute;
