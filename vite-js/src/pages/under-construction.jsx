import { Helmet } from 'react-helmet-async';
import { useLocation, Navigate } from 'react-router-dom';

import UnderConstructionView from 'src/sections/error/under-construction-view';
import { paths } from 'src/routes/paths';

export default function UnderConstructionPage() {
  const location = useLocation();

  // If redirected here from container loading, immediately redirect to container loading
  if (
    location.pathname.toLowerCase().includes('container-loading') ||
    location.search.toLowerCase().includes('containerloading') ||
    location.state?.from?.toLowerCase?.().includes('container-loading')
  ) {
    return <Navigate to={paths.dashboard.containerLoading} replace />;
  }

  return (
    <>
      <Helmet>
        <title>Under Construction</title>
      </Helmet>

      <UnderConstructionView />
    </>
  );
}
