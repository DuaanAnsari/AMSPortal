import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useTheme,
  TableSortLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// Custom Table Head Component
const TableHeadCustom = ({
  order,
  orderBy,
  headLabel,
  onSort,
  sx,
}) => {
  return (
    <TableHead sx={sx}>
      <TableRow>
        {headLabel.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{
              backgroundColor: 'inherit',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            {onSort ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={() => onSort(headCell.id)}
                sx={{
                  color: 'inherit',
                  '&:hover': { color: 'inherit' },
                  '&.Mui-active': { color: 'inherit' },
                }}
              >
                {headCell.label}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

// Table Head Config
const TABLE_HEAD = [
  { id: 'poNo', label: 'PO. No.', align: 'left' },
  { id: 'customer', label: 'Customer', align: 'left' },
  { id: 'vendor', label: 'Vendor', align: 'left' },
  { id: 'placement', label: 'Placement', align: 'left' },
  { id: 'shipment', label: 'Shipment', align: 'left' },
  { id: 'bookedQty', label: 'Booked Qty', align: 'right' },
  { id: 'shippedQty', label: 'Shipped Qty', align: 'right' },
  { id: 'cancelQty', label: 'Cancel Qty', align: 'center' },
];

export default function CancelQuantityControlPanel() {
  const theme = useTheme();
  const [poNumber, setPoNumber] = useState('');
  const [vendor, setVendor] = useState('ALL');
  
  // Table state
  const [table, setTable] = useState({
   
    orderBy: 'poNo',
  });

  const rows = [
    {
      poNo: '37080-YPO-DENIM',
      customer: 'LONE ROCK',
      vendor: 'MS Garments',
      placement: 'Feb 26, 2025',
      shipment: 'May 05, 2025',
      bookedQty: 3336,
      shippedQty: 1824,
    },
    {
      poNo: '37003-OAT',
      customer: 'LONE ROCK',
      vendor: 'MS Garments',
      placement: 'Feb 25, 2025',
      shipment: 'Apr 28, 2025',
      bookedQty: 504,
      shippedQty: 168,
    },
    {
      poNo: '36864-SS-CREAM',
      customer: 'LONE ROCK',
      vendor: 'Comfort Apparel',
      placement: 'Jan 16, 2025',
      shipment: 'Mar 10, 2025',
      bookedQty: 15600,
      shippedQty: 15504,
    },
  ];

  const handleSearch = () => {
    alert(`Searching for PO#: ${poNumber} and Vendor: ${vendor}`);
  };

  const handleSort = (property) => {
    const isAsc = table.orderBy === property && table.order === 'asc';
    setTable({
      order: isAsc ? 'desc' : 'asc',
      orderBy: property,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 🔹 HEADING - Container se bahar top pe */}
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>
        Cancel Quantity Control Panel
      </Typography>

      <Card sx={{ boxShadow: 2, borderRadius: 3 }}>
        <CardContent>
          {/* 🔍 Search + Vendor in one row */}
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="flex-start"
            sx={{ mt: 2, mb: 2 }}
          >
            {/* PO Input */}
            <Grid item xs={12} sm={3}>
              <TextField
                label="PO #"
                fullWidth
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                size="small"
              />
            </Grid>

            {/* Search Icon Button */}
            <Grid item>
              <IconButton
                onClick={handleSearch}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                <SearchIcon />
              </IconButton>
            </Grid>

            {/* Vendor Dropdown */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Vendor</InputLabel>
                <Select
                  value={vendor}
                  label="Vendor"
                  onChange={(e) => setVendor(e.target.value)}
                  sx={{
                    backgroundColor: 'background.paper',
                    borderRadius: '8px',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& .MuiSelect-select': {
                      color:
                        vendor === 'ALL' ? theme.palette.text.secondary : theme.palette.primary.main,
                      fontWeight: vendor === 'ALL' ? 400 : 600,
                    },
                  }}
                >
                  <MenuItem value="ALL">ALL</MenuItem>
                  <MenuItem value="MS Garments">MS Garments</MenuItem>
                  <MenuItem value="Comfort Apparel">Comfort Apparel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Table Section */}
          <TableContainer
            component={Paper}
            sx={{
              mt: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Table>
              {/* Custom Table Head with Theme Colors */}
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                onSort={handleSort}
                sx={{
                  '& .MuiTableRow-root': {
                    backgroundColor: theme.palette.primary.main,
                  },
                  '& .MuiTableCell-root': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderBottom: 'none',
                  },
                  '& .MuiTableSortLabel-root': {
                    color: theme.palette.primary.contrastText + '!important',
                    '&:hover': {
                      color: theme.palette.primary.contrastText + '!important',
                    },
                    '&.Mui-active': {
                      color: theme.palette.primary.contrastText + '!important',
                    },
                  },
                  '& .MuiSvgIcon-root': {
                    color: theme.palette.primary.contrastText + '!important',
                  },
                }}
              />

              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      '&:hover': { backgroundColor: theme.palette.action.hover },
                      transition: '0.2s',
                    }}
                  >
                    <TableCell>{row.poNo}</TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.vendor}</TableCell>
                    <TableCell>{row.placement}</TableCell>
                    <TableCell>{row.shipment}</TableCell>
                    <TableCell align="right">{row.bookedQty.toLocaleString()}</TableCell>
                    <TableCell align="right">{row.shippedQty.toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                        onClick={() => alert(`Cancel Qty clicked for ${row.poNo}`)}
                      >
                        Cancel QTY
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}