import { Helmet } from 'react-helmet-async';

import UnderConstructionView from 'src/sections/error/under-construction-view';

export default function UnderConstructionPage() {
  return (
    <>
      <Helmet>
        <title>Under Construction</title>
      </Helmet>

      <UnderConstructionView />
    </>
  );
}
