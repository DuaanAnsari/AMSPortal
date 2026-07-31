import { Helmet } from 'react-helmet-async';

import { UnderConstructionView } from 'src/sections/error';

// ----------------------------------------------------------------------

export default function OverviewAnalyticsPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Analytics</title>
      </Helmet>

      <UnderConstructionView />
    </>
  );
}
