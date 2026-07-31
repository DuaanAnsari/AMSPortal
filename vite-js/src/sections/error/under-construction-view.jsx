import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { ComingSoonIllustration } from 'src/assets/illustrations';

export default function UnderConstructionView() {
  return (
    <Box
      sx={{
        width: 1,
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Typography variant="h2" sx={{ mb: 2 }}>
        UNDER CONSTRUCTION
      </Typography>

      <ComingSoonIllustration
        sx={{
          height: 260,
          my: { xs: 5, sm: 8 },
        }}
      />

      <Typography sx={{ mb: 4, color: 'text.secondary', whiteSpace: 'pre-line' }}>
        {'This page is under construction.\nIt will be available soon.'}
      </Typography>

      <Button component={RouterLink} href={paths.dashboard.root} size="large" variant="contained">
        Back to Home
      </Button>
    </Box>
  );
}
