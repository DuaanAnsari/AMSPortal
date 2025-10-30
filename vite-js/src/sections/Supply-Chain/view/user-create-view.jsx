import React, { useState } from 'react';
import { Box, Button, FormControl, MenuItem, Select, Typography, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

export default function ReportFilter() {
  const [poNumber, setPoNumber] = useState('MUHAMMAD SHAHZAIB');
  const [fromDate, setFromDate] = useState(dayjs('2015-01-01'));
  const [toDate, setToDate] = useState(dayjs('2015-12-31'));

  const handleViewReport = () => {
    alert(
      `PO Number: ${poNumber}\nFrom: ${fromDate.format('DD/MM/YYYY')}\nTo: ${toDate.format(
        'DD/MM/YYYY'
      )}`
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#fff',
        padding: { xs: '20px', md: '40px 60px' },
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        width: 'fit-content',
      }}
    >
      {/* Fields Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: { xs: 3, md: 10 },
          justifyContent: 'center',
        }}
      >
        {/* PO Number */}
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ color: '#444', fontWeight: 600, mb: 1, fontSize: '1rem' }}
          >
            PO Number:
          </Typography>
          <FormControl sx={{ minWidth: { xs: 240, md: 300 } }}>
            <Select
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              size="medium"
              sx={{
                height: '48px',
                fontSize: '1rem',
              }}
            >
              <MenuItem value="MUHAMMAD SHAHZAIB">MUHAMMAD SHAHZAIB</MenuItem>
              <MenuItem value="ALI AHMED">ALI AHMED</MenuItem>
              <MenuItem value="USMAN SAEED">USMAN SAEED</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* From Date */}
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ color: '#444', fontWeight: 600, mb: 1, fontSize: '1rem' }}
          >
            From:
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              slotProps={{
                textField: {
                  size: 'medium',
                  sx: {
                    width: { xs: 240, md: 300 },
                    height: '48px',
                    fontSize: '1rem',
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Box>

        {/* To Date */}
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ color: '#444', fontWeight: 600, mb: 1, fontSize: '1rem' }}
          >
            To:
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              slotProps={{
                textField: {
                  size: 'medium',
                  sx: {
                    width: { xs: 240, md: 300 },
                    height: '48px',
                    fontSize: '1rem',
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Box>
      </Box>

      {/* View Report Button */}
      <Button
        variant="contained"
        sx={{
          backgroundColor: '#4b3b6b',
          color: '#fff',
          fontWeight: 600,
          padding: '12px 36px',
          fontSize: '1rem',
          borderRadius: '8px',
          textTransform: 'none',
          '&:hover': { backgroundColor: '#3a2f55' },
          marginLeft: '800px',
        }}
        onClick={handleViewReport}
      >
        View Report
      </Button>
    </Box>
  );
}
