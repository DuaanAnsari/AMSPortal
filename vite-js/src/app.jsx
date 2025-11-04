/* eslint-disable perfectionist/sort-imports */
import 'src/global.css';

// i18n
import 'src/locales/i18n';

// ----------------------------------------------------------------------

import Router from 'src/routes/sections';
import ThemeProvider from 'src/theme';
import { LocalizationProvider } from 'src/locales';
import { useScrollToTop } from 'src/hooks/use-scroll-to-top';
import ProgressBar from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import SnackbarProvider from 'src/components/snackbar/snackbar-provider';
import { SettingsDrawer, SettingsProvider } from 'src/components/settings';
import { CheckoutProvider } from 'src/sections/checkout/context';
import { AuthProvider } from 'src/auth/context/jwt';
import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // ✅ correct import

// ----------------------------------------------------------------------

export default function App() {
  const charAt = `
  ░░░    ░░░
  ▒▒▒▒  ▒▒▒▒
  ▒▒ ▒▒▒▒ ▒▒
  ▓▓  ▓▓  ▓▓
  ██      ██
  `;
  // console.info(`%c${charAt}`, 'color: #5BE49B');

  useScrollToTop();

  useEffect(() => {
    // ✅ Function to check token validity
    const checkTokenValidity = () => {
      const token = localStorage.getItem('accessToken');
      const currentPath = window.location.pathname;

      // 🚫 No token → redirect to login
      if (!token && currentPath !== '/auth/jwt/login') {
        console.warn('🚫 No token found → redirecting to login');
        window.location.href = '/auth/jwt/login';
        return;
      }

      // ✅ Token exists → decode and check expiry
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000; // current time in seconds

          // ⚠️ Token expired → logout instantly
          if (decoded.exp && decoded.exp < currentTime) {
            console.warn('⚠️ Token expired → logging out...');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/auth/jwt/login';
          }
        } catch (err) {
          console.error('❌ Invalid token → logging out', err);
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/auth/jwt/login';
        }
      }
    };

    // 🔹 Run immediately once on load
    checkTokenValidity();

    // 🔁 Auto check every 30 seconds (you can increase if needed)
    const interval = setInterval(checkTokenValidity, 30000);

    // 🧹 Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
      <LocalizationProvider>
        <SettingsProvider
          defaultSettings={{
            themeMode: 'light',
            themeDirection: 'ltr',
            themeContrast: 'bold',
            themeLayout: 'vertical',
            themeColorPresets: 'default',
            themeStretch: false,
          }}
        >
          <ThemeProvider>
            <MotionLazy>
              <SnackbarProvider>
                <CheckoutProvider>
                  <SettingsDrawer />
                  <ProgressBar />
                  <Router />
                </CheckoutProvider>
              </SnackbarProvider>
            </MotionLazy>
          </ThemeProvider>
        </SettingsProvider>
      </LocalizationProvider>
    </AuthProvider>
  );
}
