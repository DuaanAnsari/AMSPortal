import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom'; // 👈 Import navigation hook

const ORANGE = '#f58442';
const PURPLE = '#3a2f55';

// 🔹 Dummy Table Data
const initialRows = [
  { id: 1, portfolio: 'Hard-line', category: 'Salt', group: 'Inner Cartoon' },
  { id: 2, portfolio: 'Hard-line', category: 'Salt', group: 'Lamp' },
  { id: 3, portfolio: 'Knitwear Apparel', category: 'Knits', group: 'Adult' },
  { id: 4, portfolio: 'Knitwear Apparel', category: 'Knits', group: 'Baby' },
  { id: 5, portfolio: 'Knitwear Apparel', category: 'Knits', group: 'Mens' },
  { id: 6, portfolio: 'Knitwear Apparel', category: 'Knits', group: 'Ladies' },
];

export default function ProductGroupView() {
  const [rows] = useState(initialRows);
  const navigate = useNavigate(); // 👈 React Router hook for redirect

  // 🔹 Redirect function
  const handleAddGroup = () => {
    navigate('/dashboard/power-tool/add-group'); // 👈 Redirect to Add-group.jsx
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
        mt: 4,
        p: 3,
        boxShadow: '0px 3px 10px rgba(0,0,0,0.05)',
      }}
    >
      {/* 🔹 Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#444',
          }}
        >
          Product Group View
        </Typography>

        <Button
          variant="contained"
          sx={{
            backgroundColor: PURPLE,
            color: '#fff',
            fontWeight: 500,
            textTransform: 'none',
            px: 3,
            '&:hover': { backgroundColor: PURPLE },
          }}
          onClick={handleAddGroup} // 👈 Button click → redirect
        >
          Add Product Group
        </Button>
      </Box>

      {/* 🔹 Table Section */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0px 3px 10px rgba(0,0,0,0.05)',
        }}
      >
        <Table>
          {/* 🟠 Table Header */}
          <TableHead>
            <TableRow sx={{ backgroundColor: ORANGE }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: 'black',
                  textAlign: 'left',
                  borderRight: '1px solid #fff',
                  width: '33%',
                }}
              >
                Product Portfolio
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: 'black',
                  textAlign: 'left',
                  borderRight: '1px solid #fff',
                  width: '33%',
                }}
              >
                Product Categories
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: 'black',
                  textAlign: 'left',
                  width: '33%',
                }}
              >
                Product Group
              </TableCell>
            </TableRow>
          </TableHead>

          {/* 🟣 Table Body */}
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell
                  sx={{
                    color: '#000',
                    textAlign: 'left',
                    borderRight: '1px solid #eee',
                  }}
                >
                  {row.portfolio}
                </TableCell>
                <TableCell
                  sx={{
                    color: '#000',
                    textAlign: 'left',
                    borderRight: '1px solid #eee',
                  }}
                >
                  {row.category}
                </TableCell>
                <TableCell sx={{ color: '#000', textAlign: 'left' }}>{row.group}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
