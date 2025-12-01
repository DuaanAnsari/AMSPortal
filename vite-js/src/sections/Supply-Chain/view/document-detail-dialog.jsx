import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
} from '@mui/material';

// Simple reusable dialog to show shipment / document details for a selected row
export default function DocumentsDetailDialog({ MasterData, openDialog, closeDialog }) {
  const data = MasterData || {};

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={openDialog}
      onClose={closeDialog}
    >
      <DialogTitle>Shipment / Invoice Details</DialogTitle>

      <DialogContent dividers>
        {Object.keys(data).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No data available for this record.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {/* Left column */}
            <Grid item xs={12} sm={6}>
              {data.VendorInvoiceNo && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Vendor Invoice No:</strong> {data.VendorInvoiceNo}
                </Typography>
              )}
              {data.InvoiceDate && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Invoice Date:</strong>{' '}
                  {new Date(data.InvoiceDate).toLocaleDateString()}
                </Typography>
              )}
              {data.PONO && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>PO No:</strong> {data.PONO}
                </Typography>
              )}
              {data.CutomerName && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Customer:</strong> {data.CutomerName}
                </Typography>
              )}
              {data.VenderName && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Vendor:</strong> {data.VenderName}
                </Typography>
              )}
            </Grid>

            {/* Right column */}
            <Grid item xs={12} sm={6}>
              {data.TotalQty !== undefined && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Total Qty:</strong> {data.TotalQty}
                </Typography>
              )}
              {data.TotalValue !== undefined && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Total Value:</strong> {data.TotalValue}
                </Typography>
              )}
              {data.Mode && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Mode:</strong> {data.Mode}
                </Typography>
              )}
              {data.Currency && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Currency:</strong> {data.Currency}
                </Typography>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={closeDialog} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DocumentsDetailDialog.propTypes = {
  MasterData: PropTypes.object,
  openDialog: PropTypes.bool.isRequired,
  closeDialog: PropTypes.func.isRequired,
};




