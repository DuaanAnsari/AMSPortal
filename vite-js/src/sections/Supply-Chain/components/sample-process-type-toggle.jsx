import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha, useTheme } from '@mui/material/styles';

import { QD_SAMPLE_PROCESS_TYPES } from '../utils/qd-sample-process-types';

// ----------------------------------------------------------------------

/**
 * Same visual language as QD Inspection "Inspection Type" (IPC / MPC / …).
 * `valueInspType` null/undefined = no segment highlighted (e.g. grid row).
 */
export default function SampleProcessTypeToggle({
  valueInspType,
  onSelectInspType,
  disabled = false,
  dense = false,
  showLabel = true,
}) {
  const theme = useTheme();
  const match = QD_SAMPLE_PROCESS_TYPES.find((x) => x.inspType === valueInspType);
  const valueShort = match?.short ?? null;

  const handleChange = (_event, nextShort) => {
    if (nextShort == null) return;
    const row = QD_SAMPLE_PROCESS_TYPES.find((x) => x.short === nextShort);
    if (row) onSelectInspType(row.inspType);
  };

  const btnSx = {
    px: dense ? 1 : 2,
    fontWeight: 700,
    fontSize: dense ? 11 : 12,
    '&.Mui-selected': {
      bgcolor: alpha(theme.palette.primary.main, 0.12),
      color: 'primary.dark',
      borderColor: 'primary.main',
    },
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      {showLabel && (
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mr: 0.25 }}>
          Sample:
        </Typography>
      )}
      <ToggleButtonGroup
        value={valueShort}
        exclusive
        onChange={handleChange}
        size="small"
        disabled={disabled}
        sx={{ flexWrap: 'wrap' }}
      >
        {QD_SAMPLE_PROCESS_TYPES.map(({ short, inspType }) => (
          <ToggleButton key={short} value={short} title={inspType} sx={btnSx}>
            {short}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

SampleProcessTypeToggle.propTypes = {
  valueInspType: PropTypes.string,
  onSelectInspType: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  dense: PropTypes.bool,
  showLabel: PropTypes.bool,
};
