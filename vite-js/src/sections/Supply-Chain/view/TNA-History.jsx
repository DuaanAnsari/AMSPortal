import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({ baseURL: `${API_BASE_URL}/api` });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'userName',     label: 'User Name',                width: 120 },
  { id: 'idealDate',    label: 'Activity Date',            width: 120 },
  { id: 'status',       label: 'Status',                   width: 100 },
  { id: 'actualDate',   label: 'Factory Commitment Date',  width: 160 },
  { id: 'approvalDate', label: 'Submission Date',           width: 130 },
  { id: 'dateEstemated',label: 'Approval Date',             width: 120 },
  { id: 'qtyCompleted', label: 'Quantity Completed',        width: 140, align: 'center' },
  { id: 'creationDate', label: 'TIMESTAMP',                 width: 160 },
  { id: 'preFilledRemarks', label: 'Remarks',              width: 140 },
];

// ----------------------------------------------------------------------

const formatDate = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatTimestamp = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const isDefaultDate = (val) => {
  if (!val) return true;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) || d.getFullYear() <= 2000;
};

// ----------------------------------------------------------------------

const cellStyle = {
  padding: '10px 16px',
  fontSize: '13px',
  borderBottom: '1px solid #e0e0e0',
};

function HistoryTableRow({ row }) {
  return (
    <tr>
      <td style={{ ...cellStyle }}>
        {row.userName || row.UserName || row.username || ''}
      </td>
      <td style={{ ...cellStyle, color: '#2e7d32', fontWeight: 500 }}>
        {formatDate(row.creationDate)}
      </td>
      <td style={{ ...cellStyle, color: '#2e7d32', fontWeight: 500 }}>
        {row.status || ''}
      </td>
      <td style={{ ...cellStyle, color: '#2e7d32', fontWeight: 500 }}>
        {isDefaultDate(row.dateEstemated) ? '' : formatDate(row.dateEstemated)}
      </td>
      <td style={{ ...cellStyle, color: '#c62828', fontWeight: 500 }}>
        {isDefaultDate(row.actualDate) ? '' : formatDate(row.actualDate)}
      </td>
      <td style={{ ...cellStyle, color: '#c62828', fontWeight: 500 }}>
        {isDefaultDate(row.approvalDate) ? '' : formatDate(row.approvalDate)}
      </td>
      <td style={{ ...cellStyle, color: '#c62828', fontWeight: 500, textAlign: 'center' }}>
        {row.qtyCompleted ?? 0}
      </td>
      <td style={{ ...cellStyle, color: '#c62828', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {formatTimestamp(row.creationDate)}
      </td>
      <td style={{ ...cellStyle, color: '#c62828', fontWeight: 500 }}>
        {row.preFilledRemarks || row.remarks || ''}
      </td>
    </tr>
  );
}

// ----------------------------------------------------------------------

export default function TNAHistoryPage() {
  const location = useLocation();
  const { tnaChartID, processName, portfolioName } = location.state || {};

  const table = useTable({ defaultRowsPerPage: 10 });

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const title = [portfolioName, processName].filter(Boolean).join(' ');

  useEffect(() => {
    if (!tnaChartID) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get(`/Milestone/GetTNAHistory/${tnaChartID}`);
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('TNA History fetch error:', err);
        setError('Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [tnaChartID]);

  const dataFiltered = rows;
  const notFound     = !loading && !error && dataFiltered.length === 0;
  const denseHeight  = table.dense ? 34 : 54;

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="TNA History"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Purchase Orders', href: paths.dashboard.supplyChain.root },
          { name: 'TNA Chart', href: '/dashboard/supply-chain/tna-chart' },
          { name: 'TNA History' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      {title && (
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
          {title}
        </Typography>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {!loading && error && (
        <Typography color="error" sx={{ py: 4, textAlign: 'center' }}>
          {error}
        </Typography>
      )}

      {/* Table */}
      {!loading && !error && (
        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 900 }}>
              <Table
                stickyHeader
                size={table.dense ? 'small' : 'medium'}
                sx={{ tableLayout: 'fixed' }}
              >
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  onSort={table.onSort}
                  sx={{
                    '& .MuiTableRow-root': { backgroundColor: '#eeeeee' },
                    '& .MuiTableCell-root': { backgroundColor: '#eeeeee', color: '#000000' },
                    '& .MuiTableSortLabel-root': { color: '#000000' },
                  }}
                />

                <TableBody>
                  {dataInPage.map((row) => (
                    <HistoryTableRow key={row.tnaChartHistoryId} row={row} />
                  ))}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      )}
    </Container>
  );
}
