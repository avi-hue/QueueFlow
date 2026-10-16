import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RequireRole = ({ role, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F2E8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#D5CCC0] border-t-[#2F7D6D]"></div>
          <p className="text-sm font-medium text-[#667085]">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Support array of allowed roles or single role string
  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(user.role)) {
    // If business user went to customer page or vice versa
    if (user.role === 'customer') {
      return <Navigate to="/discover" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
