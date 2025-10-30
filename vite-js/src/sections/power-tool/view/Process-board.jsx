import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Menu,
  MenuItem,
  Checkbox,
  IconButton,
  FormControl,
  Select,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, ViewColumn } from '@mui/icons-material';

const PURPLE = '#5E17EB';

const initialRows = [
  { id: 1, process: 'Fabric Inspection', percentage: '85%' },
  { id: 2, process: 'Cutting', percentage: '78%' },
  { id: 3, process: 'Sewing', percentage: '92%' },
  { id: 4, process: 'Finishing', percentage: '88%' },
  { id: 5, process: 'Packing', percentage: '95%' },
];

export default function ProcessSchedule() {
  const [rows, setRows] = useState(initialRows);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    process: true,
    percentage: true,
  });
  const [category, setCategory] = useState('Woven Apparel');

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
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
        mt: 5, // ✅ Added margin-top: 50px
      }}
    >
      {/* 🔹 Heading */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: '#1e1e1e',
          textTransform: 'uppercase',
          mb: 2,
        }}
      >
        Milestone
      </Typography>

      {/* 🔹 Dropdown below heading */}
      <FormControl size="small" sx={{ minWidth: 300 }}>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{
            borderRadius: '8px',
            backgroundColor: '#f8f8f8',
            fontWeight: 600,
          }}
        >
          <MenuItem value="Woven Apparel">Woven Apparel</MenuItem>
          <MenuItem value="Knitwear">Knitwear Apparel</MenuItem>
          <MenuItem value="Denim">Leather Goods</MenuItem>
          <MenuItem value="Denim">Hard-line</MenuItem>
          <MenuItem value="Denim">Home Textile</MenuItem>
        </Select>
      </FormControl>

      {/* 🔹 Column Menu */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5, pr: 1 }}>
        <IconButton onClick={handleMenuOpen}>
          <ViewColumn sx={{ color: PURPLE }} />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          {Object.keys(visibleColumns).map((col) => (
            <MenuItem key={col} onClick={() => toggleColumn(col)}>
              <Checkbox checked={visibleColumns[col]} />
              <Typography sx={{ textTransform: 'capitalize' }}>
                {col === 'process' ? 'Process Name' : 'Scheduled Days %'}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* 🔹 Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: '0px 3px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              {visibleColumns.process && (
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#000',
                    textAlign: 'center',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('process')}
                >
                  Process Name{' '}
                  {sortConfig.key === 'process' &&
                    (sortConfig.direction === 'asc' ? (
                      <ArrowUpward fontSize="small" />
                    ) : (
                      <ArrowDownward fontSize="small" />
                    ))}
                </TableCell>
              )}
              {visibleColumns.percentage && (
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#000',
                    textAlign: 'center',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('percentage')}
                >
                  Scheduled Days %{' '}
                  {sortConfig.key === 'percentage' &&
                    (sortConfig.direction === 'asc' ? (
                      <ArrowUpward fontSize="small" />
                    ) : (
                      <ArrowDownward fontSize="small" />
                    ))}
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.id}
                hover
                sx={{
                  backgroundColor: index % 2 === 1 ? '#f8f8f8' : '#fff',
                }}
              >
                {visibleColumns.process && (
                  <TableCell sx={{ textAlign: 'center' }}>{row.process}</TableCell>
                )}
                {visibleColumns.percentage && (
                  <TableCell sx={{ textAlign: 'center' }}>{row.percentage}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 🔹 Update Button */}
    </Box>
  );
}
