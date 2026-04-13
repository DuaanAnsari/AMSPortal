import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import { DataGrid } from '@mui/x-data-grid';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const HEADER_GREY = '#e0e0e0';

function formatLoadingDate(isoOrDate) {
  if (!isoOrDate) return '';
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Replace with API response when backend is ready. */
const MOCK_ROWS = [
  {
    id: 1,
    merchandiser: 'RIDA AYAZ',
    supplier: 'Comfort apparel',
    bookingNo: 'AMS-036',
    poNumbers:
      '01041, 34146-SST-BLUE, 34147-SST-BLUE, 34148-SST-BLUE, 34149-SST-BLUE, 34150-SST-BLUE, 34151-SST-BLUE',
    planQtyLoad: 62688,
    loadingDate: '2023-09-26',
    cbm: 63,
    loadDestination: 'COMFORT APPAREL',
  },
  {
    id: 2,
    merchandiser: 'ALI RAZA',
    supplier: 'Mode textile',
    bookingNo: 'AMS-037',
    poNumbers: '01042, 34152-RED',
    planQtyLoad: 12000,
    loadingDate: '2023-10-01',
    cbm: 24,
    loadDestination: 'KARACHI PORT',
  },
];

// ----------------------------------------------------------------------

export default function ContainerLoadingViewPage() {
  const [poInput, setPoInput] = useState('');
  const [searchPo, setSearchPo] = useState('');

  const handleSearch = useCallback(() => {
    setSearchPo(poInput.trim());
  }, [poInput]);

  const rows = useMemo(() => {
    if (!searchPo) return MOCK_ROWS;
    const q = searchPo.toLowerCase();
    return MOCK_ROWS.filter(
      (r) =>
        r.poNumbers.toLowerCase().includes(q) ||
        String(r.bookingNo).toLowerCase().includes(q)
    );
  }, [searchPo]);

  const columns = useMemo(
    () => [
      {
        field: 'merchandiser',
        headerName: 'Merchandiser',
        flex: 0.9,
        minWidth: 120,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'supplier',
        headerName: 'Supplier',
        flex: 0.9,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'bookingNo',
        headerName: 'Booking No.',
        flex: 0.7,
        minWidth: 110,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'poNumbers',
        headerName: 'PO #',
        flex: 1.6,
        minWidth: 220,
        headerAlign: 'center',
        align: 'left',
      },
      {
        field: 'planQtyLoad',
        headerName: 'Plan Quantity Load',
        flex: 0.75,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        type: 'number',
      },
      {
        field: 'loadingDate',
        headerName: 'Loading Date',
        flex: 0.75,
        minWidth: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => formatLoadingDate(params.row?.loadingDate),
      },
      {
        field: 'cbm',
        headerName: 'CBM',
        width: 90,
        headerAlign: 'center',
        align: 'center',
        type: 'number',
      },
      {
        field: 'loadDestination',
        headerName: 'Load Destination',
        flex: 1,
        minWidth: 140,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'cartonScan',
        headerName: 'Carton Scan',
        width: 120,
        sortable: false,
        filterable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <IconButton
            size="small"
            color="primary"
            aria-label="Carton scan"
            onClick={() => {
              // Wire scanner / detail flow when API is ready
              console.info('Carton scan', params.row.id);
            }}
          >
            <Iconify icon="solar:scanner-bold-duotone" width={28} />
          </IconButton>
        ),
      },
    ],
    []
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="CONTAINER LOADING VIEW"
        links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'CONTAINER LOADING' }]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography component="label" htmlFor="container-loading-po" sx={{ fontWeight: 500 }}>
            PO # :
          </Typography>
          <TextField
            id="container-loading-po"
            size="small"
            placeholder=""
            value={poInput}
            onChange={(e) => setPoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 220 }}
          />
        </Stack>
        <Button variant="contained" color="primary" onClick={handleSearch} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          Search
        </Button>
      </Stack>

      <Card
        variant="outlined"
        sx={{
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Paper sx={{ width: '100%', height: { xs: 520, md: 'min(70vh, 640px)' } }} elevation={0}>
          <DataGrid
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            getRowHeight={() => 'auto'}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            sx={(theme) => ({
              border: 'none',
              height: '100%',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: HEADER_GREY,
                color: '#374151',
                borderBottom: 'none',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: '#374151',
                fontWeight: 700,
                whiteSpace: 'normal',
                lineHeight: 1.25,
                textAlign: 'center',
              },
              '& .MuiDataGrid-columnSeparator': { color: 'rgba(55,65,81,0.35)' },
              '& .MuiDataGrid-cell': {
                alignItems: 'flex-start',
                py: 1.25,
                whiteSpace: 'normal',
                lineHeight: 1.45,
                borderColor: 'divider',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${theme.palette.divider}`,
              },
            })}
          />
        </Paper>
      </Card>
    </Container>
  );
}
