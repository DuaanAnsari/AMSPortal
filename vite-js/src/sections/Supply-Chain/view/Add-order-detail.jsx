import React, { useState } from 'react';
// 🔹 Temporarily disable shirt.png import
// import shirtImage from 'src/assets/icons/shirt.png';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Typography,
  Menu,
  MenuItem,
  Checkbox,
  IconButton,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { ArrowUpward, ArrowDownward, ViewColumn } from '@mui/icons-material';

const PURPLE = '#5E17EB';
const HEADER_ORANGE = 'black';

// 🔹 Use placeholder text instead of image
const initialRows = [
  {
    id: 1,
    image: null,
    description: 'S/s shirt',
    color: '1- (BLACK_240) 2- (BLACK_288)',
    mainCare: dayjs(),
    hangtag: dayjs(),
    licenser: dayjs(),
  },
  {
    id: 2,
    image: null,
    description: 'S/s shirt',
    color: '1- (BLACK_24) 2- (BLACK_168) 3- (BLACK_216) 4- (BLACK_240) 5- (BLACK_264)',
    mainCare: dayjs(),
    hangtag: dayjs(),
    licenser: dayjs(),
  },
];

export default function POSizeWise() {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    description: true,
    color: true,
    mainCare: true,
    hangtag: true,
    licenser: true,
  });

  const handleDateChange = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSearch = () => {
    if (search.trim() === '') {
      alert('Please enter a PO number first.');
      setShowTable(false);
      return;
    }
    setShowTable(true);
  };

  const handleUpdate = () => {
    console.log('Updated Rows:', rows);
    alert('Update called — check console for data.');
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...rows].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setRows(sorted);
  };

  const open = Boolean(anchorEl);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <Box sx={{ width: '100%', backgroundColor: '#fff', borderRadius: 2 }}>
      {/* 🔹 Heading + PO Search */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#1e1e1e',
            textTransform: 'uppercase',
            mb: 5.5,
          }}
        >
          PO Size Wise
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Enter PO Number"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 400,
              '& .MuiOutlinedInput-root': { borderRadius: '8px' },
            }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: PURPLE,
              color: 'white',
              borderRadius: '8px',
              px: 3,
              textTransform: 'none',
              marginLeft: '350px',
              '&:hover': { backgroundColor: '#5b53f4ff' },
            }}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Box>
      </Box>

      {/* 🔹 Table */}
      {showTable && (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mb: 1.5,
              pr: 2,
            }}
          >
            <IconButton onClick={handleMenuOpen}>
              <ViewColumn sx={{ color: PURPLE }} />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
              {Object.keys(visibleColumns).map((col) => (
                <MenuItem key={col} onClick={() => toggleColumn(col)}>
                  <Checkbox checked={visibleColumns[col]} />
                  <Typography sx={{ textTransform: 'capitalize' }}>{col}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              boxShadow: '0px 3px 10px rgba(0,0,0,0.1)',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: HEADER_ORANGE }}>
                  {visibleColumns.image && (
                    <TableCell sx={{ color: 'black', fontWeight: 600, textAlign: 'center' }}>
                      Image
                    </TableCell>
                  )}
                  {visibleColumns.description && (
                    <TableCell sx={{ color: 'black', fontWeight: 600, textAlign: 'center' }}>
                      Description
                    </TableCell>
                  )}
                  {visibleColumns.color && (
                    <TableCell sx={{ color: 'black', fontWeight: 600, textAlign: 'center' }}>
                      Color
                    </TableCell>
                  )}
                  {visibleColumns.mainCare && (
                    <TableCell sx={{ color: 'black', fontWeight: 600, textAlign: 'center' }}>
                      Main-Care Label
                    </TableCell>
                  )}
                  {visibleColumns.hangtag && (
                    <TableCell sx={{ color: 'black', fontWeight: 600, textAlign: 'center' }}>
                      Hangtag
                    </TableCell>
                  )}
                  {visibleColumns.licenser && (
                    <TableCell sx={{ color: 'black', fontWeight: 600, textAlign: 'center' }}>
                      Licenser Sample
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    {visibleColumns.image && (
                      <TableCell sx={{ textAlign: 'center' }}>
                        {row.image ? (
                          <Box
                            component="img"
                            src={row.image}
                            alt="img"
                            sx={{
                              width: 120,
                              height: 80,
                              borderRadius: 2,
                              objectFit: 'contain',
                              backgroundColor: '#fff',
                              border: '1px solid #e0e0e0',
                            }}
                          />
                        ) : (
                          <Typography color="text.secondary" fontSize={14}>
                            No Image
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.description && (
                      <TableCell sx={{ textAlign: 'center' }}>{row.description}</TableCell>
                    )}
                    {visibleColumns.color && (
                      <TableCell sx={{ whiteSpace: 'normal', textAlign: 'center' }}>
                        {row.color}
                      </TableCell>
                    )}
                    {visibleColumns.mainCare && (
                      <TableCell sx={{ textAlign: 'center' }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            value={row.mainCare || dayjs()}
                            onChange={(newValue) => handleDateChange(row.id, 'mainCare', newValue)}
                            slotProps={{
                              textField: { size: 'small', sx: { width: 150 } },
                            }}
                          />
                        </LocalizationProvider>
                      </TableCell>
                    )}
                    {visibleColumns.hangtag && (
                      <TableCell sx={{ textAlign: 'center' }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            value={row.hangtag || dayjs()}
                            onChange={(newValue) => handleDateChange(row.id, 'hangtag', newValue)}
                            slotProps={{
                              textField: { size: 'small', sx: { width: 150 } },
                            }}
                          />
                        </LocalizationProvider>
                      </TableCell>
                    )}
                    {visibleColumns.licenser && (
                      <TableCell sx={{ textAlign: 'center' }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            value={row.licenser || dayjs()}
                            onChange={(newValue) => handleDateChange(row.id, 'licenser', newValue)}
                            slotProps={{
                              textField: { size: 'small', sx: { width: 150 } },
                            }}
                          />
                        </LocalizationProvider>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 🔹 Update Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: PURPLE,
                borderRadius: '8px',
                px: 4,
                py: 1.2,
                textTransform: 'none',
                fontSize: '15px',
                '&:hover': { backgroundColor: '#4a12be' },
              }}
              onClick={handleUpdate}
            >
              Update
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
