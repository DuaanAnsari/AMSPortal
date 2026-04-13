import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

const Logo = forwardRef(({ disabledLink = false, sx, ...other }, ref) => {
  // AMS Logo using image from public folder
  const logo = (
    <Box
      component="img"
      src="/logo/AMSlogo.png" // ← Yahan aap ka naya logo
      alt="AMS Logo"
      sx={{
        width: 150, // ← Width adjust karein apne logo ke hisab se
        height: 50, // ← Height adjust karein apne logo ke hisab se
        cursor: 'pointer',
        ...sx,
      }}
      {...other}
    />
  );

  if (disabledLink) {
    return logo;
  }

  return (
    <Link component={RouterLink} href="/" sx={{ display: 'contents' }}>
      {logo}
    </Link>
  );
});

Logo.propTypes = {
  disabledLink: PropTypes.bool,
  sx: PropTypes.object,
};

export default Logo;
