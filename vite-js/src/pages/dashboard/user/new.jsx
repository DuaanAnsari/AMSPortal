import { Helmet } from 'react-helmet-async';

import { MerchandiserBacklogView } from 'src/sections/Supply-Chain/view';

// ----------------------------------------------------------------------

export default function MerchandiserBacklogPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Merchandiser Backlog</title>
      </Helmet>

      <MerchandiserBacklogView />
    </>
  );
}
