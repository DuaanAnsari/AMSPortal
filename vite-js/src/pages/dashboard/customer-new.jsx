import { Helmet } from 'react-helmet-async';

import CustomerNewView from 'src/sections/customer/view/customer-new-view';

export default function CustomerCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new customer</title>
      </Helmet>

      <CustomerNewView />
    </>
  );
}
