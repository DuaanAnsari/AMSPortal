import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Switch,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Close';

const sizeRangeOptions = [
  '0-17',
  '04-06X',
  '04-07',
  '04-08X',
  '07-16',
  '08-20',
  '0X-3X',
  '1 X 1',
  '10-8',
  '10/12',
  '14-24',
  '16 X-20 XM',
  'Empty Range',
];

// 🔹 Dummy Data for each size range
const initialData = {
  '0-17': [
    { id: 1, size: 'XS' },
    { id: 2, size: 'S' },
    { id: 3, size: 'M' },
  ],
  '04-06X': [
    { id: 1, size: '04' },
    { id: 2, size: '05' },
    { id: 3, size: '06X' },
  ],
  '04-07': [
    { id: 1, size: '04' },
    { id: 2, size: '05' },
    { id: 3, size: '06' },
    { id: 4, size: '07' },
  ],
  '04-08X': [
    { id: 1, size: '04' },
    { id: 2, size: '05' },
    { id: 3, size: '06' },
    { id: 4, size: '07' },
    { id: 5, size: '08X' },
  ],
  '07-16': [
    { id: 1, size: '07' },
    { id: 2, size: '08' },
    { id: 3, size: '10' },
    { id: 4, size: '12' },
    { id: 5, size: '16' },
  ],
  '08-20': [
    { id: 1, size: '08' },
    { id: 2, size: '10' },
    { id: 3, size: '12' },
    { id: 4, size: '14' },
    { id: 5, size: '20' },
  ],
  '0X-3X': [
    { id: 1, size: '0X' },
    { id: 2, size: '1X' },
    { id: 3, size: '2X' },
    { id: 4, size: '3X' },
  ],
  '1 X 1': [{ id: 1, size: '1' }],
  '10-8': [
    { id: 1, size: '10' },
    { id: 2, size: '8' },
  ],
  '10/12': [
    { id: 1, size: '10' },
    { id: 2, size: '12' },
  ],
  '14-24': [
    { id: 1, size: '14' },
    { id: 2, size: '16' },
    { id: 3, size: '18' },
    { id: 4, size: '20' },
    { id: 5, size: '24' },
  ],
  '16 X-20 XM': [
    { id: 1, size: '16X' },
    { id: 2, size: '18X' },
    { id: 3, size: '20XM' },
  ],
  'Empty Range': [],
};

export default function SizeRangeAdd() {
  const [sizeRange, setSizeRange] = useState('');
  const [size, setSize] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [dense, setDense] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [data, setData] = useState(initialData);
  const [selectedRanges, setSelectedRanges] = useState([]);

  // 🔹 When new size range selected
  useEffect(() => {
    if (sizeRange && !selectedRanges.includes(sizeRange)) {
      setSelectedRanges((prev) => [...prev, sizeRange]);
    }
  }, [sizeRange]);

  // 🔹 Add new size to selected size range
  const handleAddMore = () => {
    if (!sizeRange) {
      setOpenSnackbar(true);
      return;
    }

    if (!size.trim()) return;

    setData((prev) => {
      const updated = { ...prev };
      const currentList = updated[sizeRange] || [];
      const newId = currentList.length ? currentList[currentList.length - 1].id + 1 : 1;
      updated[sizeRange] = [...currentList, { id: newId, size }];
      return updated;
    });

    setSize('');
  };

  // 🔹 Delete specific size row
  const handleDelete = (range, id) => {
    setData((prev) => {
      const updated = { ...prev };
      updated[range] = updated[range].filter((row) => row.id !== id);
      return updated;
    });

    setSelectedRanges((prev) =>
      data[range].length === 1 ? prev.filter((r) => r !== range) : prev
    );
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleSave = () => {
    console.log('Saved Data:', data);
    alert('✅ Data saved successfully!');
  };

  const handleCancel = () => {
    setSelectedRanges([]);
    setSizeRange('');
    setSize('');
  };

  // 🔹 Combine data of all selected ranges
  const combinedRows = selectedRanges.flatMap((range) =>
    data[range].length
      ? data[range].map((row) => ({ ...row, range }))
      : [{ id: 'no-data-' + range, size: null, range }]
  );

  return (
    <Box sx={{ width: '100%', mt: '40px' }}>
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: '#faf8f89c',
            py: 1.5,
            px: 3,
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#444' }}>
            Size Range Entry
          </Typography>
        </Box>

        {/* Form */}
        <CardContent sx={{ backgroundColor: '#fff', py: 4, px: 5 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Size Range Dropdown */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#444', mb: 1 }}>
                Size Range
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={sizeRange}
                  onChange={(e) => setSizeRange(e.target.value)}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {sizeRangeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Size(s) Field + Add More */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#444', mb: 1 }}>
                Size(s)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#3b2b63',
                    color: '#fff',
                    px: 3,
                    height: '40px',
                    width: '150px',
                    '&:hover': { backgroundColor: '#2d1f4b' },
                  }}
                  onClick={handleAddMore}
                >
                  Add More
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Table Grid */}
          {selectedRanges.length > 0 && (
            <Box sx={{ mt: 5 }}>
              <TableContainer component={Paper} sx={{ border: '1px solid #ddd' }}>
                <Table size={dense ? 'small' : 'medium'}>
                  <TableHead sx={{ backgroundColor: '#f58442' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                        Size Range
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Size</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {combinedRows
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow key={`${row.range}-${row.id}`}>
                          <TableCell sx={{ textAlign: 'center' }}>{row.range}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            {row.size || <em style={{ color: '#999' }}>No data</em>}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            {row.size && (
                              <IconButton
                                sx={{ color: 'darkred' }}
                                onClick={() => handleDelete(row.range, row.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Dense switch + Pagination + Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch checked={dense} onChange={() => setDense(!dense)} color="primary" />
                  }
                  label="Dense"
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: '#3b2b63',
                      color: '#fff',
                      px: 5,
                      '&:hover': { backgroundColor: '#2d1f4b' },
                    }}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: '#2d1f4b',
                      color: '#fff',
                      px: 5,
                      '&:hover': { backgroundColor: '#555' },
                    }}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>

              <TablePagination
                component="div"
                count={combinedRows.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="warning"
          sx={{ backgroundColor: '#3b2b63', color: '#fff' }}
        >
          Please select a Size Range first!
        </Alert>
      </Snackbar>
    </Box>
  );
}
