import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  const check = useCallback(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      // 🔑 No token → redirect to login
      const searchParams = new URLSearchParams({
        returnTo: window.location.pathname,
      }).toString();

      const href = `${paths.auth.jwt.login}?${searchParams}`;
      router.replace(href);
    } else {
      setAuthenticated(true);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    check();
  }, [check]);

  if (loading) {
    return <SplashScreen />;
  }

  if (!authenticated) {
    return null; // prevent rendering before redirect
  }

  return <>{children}</>;
}

AuthGuard.propTypes = {
  children: PropTypes.node,
};
