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
} from '@mui/material';
import { useNavigate } from 'react-router-dom'; // ✅ import added

const ORANGE = '#f58442';
const PURPLE = '#2f1d59';

const initialRows = [
  { id: 1, portfolio: 'Hard-line', category: 'Salt' },
  { id: 2, portfolio: 'Knitwear Apparel', category: 'Knits' },
  { id: 3, portfolio: 'Knitwear Apparel', category: 'WOMEN' },
  { id: 4, portfolio: 'Woven Apparel', category: 'Wovens' },
];

export default function ProductCategoriesView() {
  const [rows] = useState(initialRows);
  const navigate = useNavigate(); // ✅ initialize navigation

  const handleAddOrderDetail = () => {
    navigate('/dashboard/power-tool/order-detail'); // ✅ redirect here
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
        mt: 5,
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
            color: '#333',
          }}
        >
          Product Categories View
        </Typography>

        <Button
          variant="contained"
          onClick={handleAddOrderDetail} // ✅ redirect action
          sx={{
            backgroundColor: '#3a2f55',
            color: '#fff',
            fontWeight: 500,
            textTransform: 'none',
            px: 3,
            '&:hover': { backgroundColor: '#3a2f55' },
          }}
        >
          Add Order Detail
        </Button>
      </Box>

      {/* 🔹 Table Section */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0px 3px 10px rgba(0,0,0,0.05)',
          mt: '30px',
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
                  textAlign: 'center',
                  fontSize: '15px',
                  borderRight: '1px solid #fff',
                }}
              >
                Product Portfolio
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: 'black',
                  textAlign: 'center',
                  fontSize: '15px',
                }}
              >
                Product Categories
              </TableCell>
            </TableRow>
          </TableHead>

          {/* 🟣 Table Body */}
          <TableBody>
            <TableRow sx={{ backgroundColor: '#3a2f55' }}>
              <TableCell
                sx={{
                  color: '#fff',
                  fontWeight: 600,
                  textAlign: 'center',
                  borderRight: '1px solid #fff',
                }}
              >
                Hard-line
              </TableCell>
              <TableCell
                sx={{
                  color: '#fff',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Salt
              </TableCell>
            </TableRow>

            {rows.slice(1).map((row, index) => (
              <TableRow
                key={row.id}
                sx={{
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                }}
              >
                <TableCell
                  sx={{
                    textAlign: 'center',
                    color: '#000',
                    borderRight: '1px solid #eee',
                  }}
                >
                  {row.portfolio}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', color: '#000' }}>{row.category}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
