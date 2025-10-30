// src/routes/index.jsx
import { Navigate, useRoutes } from 'react-router-dom';

// import { PATH_AFTER_LOGIN } from 'src/config-global';
import { authRoutes } from './auth';
import { authDemoRoutes } from './auth-demo';
import { mainRoutes } from './main';
import { dashboardRoutes } from './dashboard';
import { componentsRoutes } from './components';

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    // Direct root to login page (remove landing/home page)
    {
      path: '/',
      element: <Navigate to="/auth/jwt/login" replace />,
    },

    // Auth routes
    ...authRoutes,
    ...authDemoRoutes,

    // Dashboard routes
    ...dashboardRoutes,

    // Main routes
    ...mainRoutes,

    // Components routes
    ...componentsRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
