import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Paper from '@mui/material/Paper';
import { DataGrid } from '@mui/x-data-grid';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export default function MasterOrderForQDSheetView() {
  const [filteringItem, setFilteringItem] = useState('yes');
  const [poNo, setPoNo] = useState('');

  const columns = useMemo(
    () => [
      { field: 'customer', headerName: 'Customer', minWidth: 170 },
      { field: 'supplier', headerName: 'Supplier', minWidth: 230 },
      { field: 'ams', headerName: 'AMS', minWidth: 70 },
      { field: 'merchant', headerName: 'Merchant', minWidth: 180 },
      { field: 'season', headerName: 'Season', minWidth: 95 },
      { field: 'productGroup', headerName: 'Product Group', minWidth: 130 },
      { field: 'composition', headerName: 'Composition', minWidth: 120 },
      { field: 'poNumber', headerName: 'PO NO.', minWidth: 105 },
      { field: 'itemQty', headerName: 'Item Qty', minWidth: 85, align: 'center', headerAlign: 'center' },
      { field: 'claimQty', headerName: 'Claim Qty', minWidth: 90, align: 'center', headerAlign: 'center' },
      { field: 'shipmentDate', headerName: 'Shipment Date', minWidth: 120 },
      { field: 'wipStatus', headerName: 'WIP Status', minWidth: 90, align: 'center', headerAlign: 'center' },
      { field: 'finalPassQty', headerName: 'Final Pass Qty', minWidth: 120, align: 'center', headerAlign: 'center' },
      { field: 'ipc', headerName: 'IPC', minWidth: 75, align: 'center', headerAlign: 'center' },
      { field: 'mpc', headerName: 'MPC', minWidth: 75, align: 'center', headerAlign: 'center' },
      { field: 'preFinal', headerName: 'Pre-Final', minWidth: 105, align: 'center', headerAlign: 'center' },
      { field: 'final', headerName: 'Final', minWidth: 85, align: 'center', headerAlign: 'center' },
      { field: 'viewPO', headerName: 'View PO', minWidth: 95, align: 'center', headerAlign: 'center' },
      { field: 'protoFit', headerName: 'Proto Fit', minWidth: 95, align: 'center', headerAlign: 'center' },
      { field: 'dyelot', headerName: 'Dyelot', minWidth: 85, align: 'center', headerAlign: 'center' },
      { field: 'strikeoff', headerName: 'Strikeoff', minWidth: 95, align: 'center', headerAlign: 'center' },
      { field: 'ppSample', headerName: 'PP Sample', minWidth: 100, align: 'center', headerAlign: 'center' },
      { field: 'sizeSet', headerName: 'Size Set', minWidth: 95, align: 'center', headerAlign: 'center' },
    ],
    []
  );

  const allRows = useMemo(
    () => [
      {
        id: 1,
        customer: 'Asad Abdul Rahim',
        supplier: 'ABDULLAH ENTERPRISES',
        ams: 'AMS 01',
        merchant: 'HASSAN ALI TIRMIZI',
        season: 'PRODUCT',
        productGroup: 'Men',
        composition: 'PRODUCT',
        poNumber: 'PRODUCT1',
        itemQty: 0,
        claimQty: 0,
        shipmentDate: '04/03/2026',
        wipStatus: '--',
        finalPassQty: 0,
        ipc: 'IPC',
        mpc: 'MPC',
        preFinal: 'Pre-Final',
        final: 'Final',
        viewPO: 'PO View',
        protoFit: 'PF',
        dyelot: 'DL',
        strikeoff: 'SO',
        ppSample: 'PPS',
        sizeSet: 'SS',
      },
      {
        id: 2,
        customer: 'Asad Abdul Rahim',
        supplier: 'ABC',
        ams: 'AMS 01',
        merchant: 'MUHAMMAD SHAHZAIB',
        season: 'Process',
        productGroup: 'Inner Cattoon',
        composition: 'Process',
        poNumber: '209',
        itemQty: 18,
        claimQty: 0,
        shipmentDate: '12/03/2026',
        wipStatus: '--',
        finalPassQty: 0,
        ipc: 'IPC',
        mpc: 'MPC',
        preFinal: 'Pre-Final',
        final: 'Final',
        viewPO: 'PO View',
        protoFit: 'PF',
        dyelot: 'DL',
        strikeoff: 'SO',
        ppSample: 'PPS',
        sizeSet: 'SS',
      },
      {
        id: 3,
        customer: 'Asad Abdul Rahim',
        supplier: 'ABC',
        ams: 'AMS 01',
        merchant: 'MUHAMMAD SHAHZAIB',
        season: 'Process',
        productGroup: 'Inner Cattoon',
        composition: 'Process',
        poNumber: '208',
        itemQty: 18,
        claimQty: 0,
        shipmentDate: '03/03/2026',
        wipStatus: '--',
        finalPassQty: 0,
        ipc: 'IPC',
        mpc: 'MPC',
        preFinal: 'Pre-Final',
        final: 'Final',
        viewPO: 'PO View',
        protoFit: 'PF',
        dyelot: 'DL',
        strikeoff: 'SO',
        ppSample: 'PPS',
        sizeSet: 'SS',
      },
    ],
    []
  );

  const rows = useMemo(() => {
    if (!poNo.trim()) return allRows;
    const query = poNo.trim().toLowerCase();
    return allRows.filter((r) => String(r.poNumber).toLowerCase().includes(query));
  }, [allRows, poNo]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="MASTER ORDER FOR QD SHEET"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'MASTER ORDER FOR QD SHEET' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card
        variant="outlined"
        sx={{
          p: 2,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Master Order For QDSheet
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }} sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Show filtering item
            </Typography>
            <RadioGroup
              row
              value={filteringItem}
              onChange={(e) => setFilteringItem(e.target.value)}
            >
              <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
              <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
            </RadioGroup>
          </Box>

          <TextField
            label="PO No:"
            size="small"
            value={poNo}
            onChange={(e) => setPoNo(e.target.value)}
            sx={{ minWidth: { xs: '100%', md: 320 } }}
          />

          <Button
            variant="contained"
            color="primary"
            sx={{ minWidth: 140, height: 40 }}
          >
            Search
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              px: 2,
              py: 1,
              fontSize: 14,
              color: 'text.secondary',
              textAlign: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: '#f5f5f5',
            }}
          >
            Drag a column header and drop it here to group by that column
          </Box>

          <Box sx={{ height: 430 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              rowHeight={46}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#e0e0e0',
                  color: '#374151',
                  borderBottom: '1px solid #d9d9d9',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  color: '#374151',
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                },
                '& .MuiDataGrid-columnSeparator': {
                  color: 'rgba(55,65,81,0.35)',
                },
                '& .MuiDataGrid-cell': {
                  borderColor: '#d9d9d9',
                  fontSize: 14,
                },
              }}
            />
          </Box>
        </Paper>
      </Card>
    </Container>
  );
}
