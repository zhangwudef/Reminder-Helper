import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';

const ProtectedRoute = () => {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;