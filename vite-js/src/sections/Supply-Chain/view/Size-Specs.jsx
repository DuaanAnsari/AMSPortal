import { Navigate, useParams } from 'react-router-dom';

import { paths } from 'src/routes/paths';

/**
 * Legacy deep link from My Order: `/supply-chain/size-specs/:id` (POID).
 * Forwards to Size Specs Edit with query params matching `SelfSizeSpecsEntry.aspx`.
 */
export default function SizeSpecsLegacyRedirect() {
  const { id } = useParams();
  const safe = id != null ? String(id) : '';
  const to = paths.dashboard.supplyChain.sizeSpecsEditWithQuery(safe, safe);
  return <Navigate replace to={to} />;
}
