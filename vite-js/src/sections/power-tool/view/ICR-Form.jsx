import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControlLabel,
  Switch,
  useTheme,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// 🔹 Dummy Data
const dummyData = [
  {
    supplier: 'Comfort apparel',
    styleNo: 'LR2096',
    poNo: '36548-LS-Sage',
    shipmentDate: 'Dec 23, 2024',
    taskNature: 'Final',
    offerQty: 576,
    offerDate: 'Dec 31, 2024',
    planDate: 'Dec 31, 2024',
    approvedPerson: '',
    remarks: '',
    status: 'Pending',
  },
  {
    supplier: 'Comfort apparel',
    styleNo: 'LR2096',
    poNo: '36548-LS-Red',
    shipmentDate: 'Dec 23, 2024',
    taskNature: 'Final',
    offerQty: 6288,
    offerDate: 'Dec 31, 2024',
    planDate: 'Dec 31, 2024',
    approvedPerson: '',
    remarks: '',
    status: 'Pending',
  },
  {
    supplier: 'Comfort apparel',
    styleNo: 'LR2096',
    poNo: '36548-LS-LILAC',
    shipmentDate: 'Dec 23, 2024',
    taskNature: 'Final',
    offerQty: 1584,
    offerDate: 'Dec 31, 2024',
    planDate: 'Dec 31, 2024',
    approvedPerson: '',
    remarks: '',
    status: 'Pending',
  },
  {
    supplier: 'Comfort apparel',
    styleNo: 'LR2096',
    poNo: '36548-LS-DUSTY',
    shipmentDate: 'Dec 23, 2024',
    taskNature: 'Final',
    offerQty: 144,
    offerDate: 'Dec 31, 2024',
    planDate: 'Dec 31, 2024',
    approvedPerson: '',
    remarks: '',
    status: 'Pending',
  },
  {
    supplier: 'Comfort apparel',
    styleNo: 'LR2096',
    poNo: '36548-LS-CREAM',
    shipmentDate: 'Dec 23, 2024',
    taskNature: 'Final',
    offerQty: 1296,
    offerDate: 'Dec 31, 2024',
    planDate: 'Dec 31, 2024',
    approvedPerson: '',
    remarks: '',
    status: 'Pending',
  },
  {
    supplier: 'Comfort apparel',
    styleNo: 'LR2096',
    poNo: '36548-LS-CHAR',
    shipmentDate: 'Dec 23, 2024',
    taskNature: 'Final',
    offerQty: 2880,
    offerDate: 'Dec 31, 2024',
    planDate: 'Dec 31, 2024',
    approvedPerson: '',
    remarks: '',
    status: 'Pending',
  },
];

export default function ICRSupplierView() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState(dummyData);
  const [dense, setDense] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // 🔹 Handle Search
  const handleSearch = () => {
    if (search.trim() === '') {
      setFilteredData(dummyData);
    } else {
      const result = dummyData.filter((row) =>
        row.poNo.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredData(result);
      setPage(0);
    }
  };

  // 🔹 Pagination
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      {/* 🔹 Header with Breadcrumb */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          color={theme.palette.primary.main}
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            mb: 1,
          }}
        >
          ICR Supplier View
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{
              mx: 1,
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            •
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            ICR Supplier
          </Typography>
        </Box>
      </Box>

      {/* 🔹 Main Card */}
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ backgroundColor: '#fff', p: 4 }}>
          {/* 🔹 Search Section */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontWeight: 'bold' }}>PO No:</Typography>
              <TextField
                size="small"
                placeholder="Enter PO No"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: 260 }}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{
                  px: 4,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
                onClick={handleSearch}
              >
                Search
              </Button>
            </Box>
          </Box>

          {/* 🔹 Table Section */}
          <TableContainer
            component={Paper}
            sx={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <Table size={dense ? 'small' : 'medium'} sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                  {[
                    'Supplier',
                    'Style No',
                    'PO No.',
                    'Shipment Date',
                    'Task Nature',
                    'Offer Qty',
                    'Offer Date',
                    'Plan Date',
                    'Approved Person',
                    'Remarks',
                    'Status',
                    'Approve / Reject',
                  ].map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        color: theme.palette.primary.contrastText,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                      <TableRow
                        key={index}
                        hover
                        sx={{
                          '&:nth-of-type(even)': {
                            backgroundColor: '#fafafa',
                          },
                        }}
                      >
                        <TableCell align="center">{row.supplier}</TableCell>
                        <TableCell align="center">{row.styleNo}</TableCell>
                        <TableCell align="center">{row.poNo}</TableCell>
                        <TableCell align="center">{row.shipmentDate}</TableCell>
                        <TableCell align="center">{row.taskNature}</TableCell>
                        <TableCell align="center">{row.offerQty}</TableCell>
                        <TableCell align="center">{row.offerDate}</TableCell>
                        <TableCell align="center">{row.planDate}</TableCell>
                        <TableCell align="center">{row.approvedPerson || '-'}</TableCell>
                        <TableCell align="center">{row.remarks || '-'}</TableCell>
                        <TableCell align="center">{row.status}</TableCell>

                        {/* ✅ Updated Approve/Reject Column */}
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Link
                              component="button"
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                textDecoration: 'none',
                                color: theme.palette.success.main,
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              Approve
                            </Link>
                            <Link
                              component="button"
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                textDecoration: 'none',
                                color: theme.palette.error.main,
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              Reject
                            </Link>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 🔹 Footer Controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
            }}
          >
            <FormControlLabel
              control={<Switch checked={dense} onChange={() => setDense(!dense)} color="primary" />}
              label="Dense"
            />
            <TablePagination
              component="div"
              count={filteredData.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
