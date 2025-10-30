import { Helmet } from 'react-helmet-async';

import { UserCardsView } from 'src/sections/Supply-Chain/view';

// ----------------------------------------------------------------------

export default function UserCardsPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: User Cards</title>
      </Helmet>

      <UserCardsView />
    </>
  );
}
