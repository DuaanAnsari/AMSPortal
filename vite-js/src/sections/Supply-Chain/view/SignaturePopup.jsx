import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import Iconify from 'src/components/iconify';

export default function SignaturePopup({ open, onClose, onSave, title, existingSign }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Clear canvas on open
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (existingSign) {
         const img = new Image();
         img.onload = () => {
           ctx.drawImage(img, 0, 0);
         };
         img.src = existingSign; 
      }
    }
  }, [open, existingSign]);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e) => {
    if (e.touches && e.touches[0]) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top,
      };
    }
    // Handle mouse events correctly even if scrolled
    if (e.nativeEvent.offsetX !== undefined) {
        return { offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY };
    }
    const rect = canvasRef.current.getBoundingClientRect();
    return {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
    };
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    
    // Check if the canvas is completely blank
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      onSave(null);
      return;
    }

    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title || 'Digital Signature'}
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
          Please use your mouse or touch screen to sign inside the box below:
        </Typography>
        <Box
          sx={{
            border: '2px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
            overflow: 'hidden',
            touchAction: 'none', // Critical for mobile
            cursor: 'default',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}
        >
          <canvas
            ref={canvasRef}
            width={550}
            height={200}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClear} color="inherit" variant="outlined">
          Clear
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Signature
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SignaturePopup.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  title: PropTypes.string,
  existingSign: PropTypes.string,
};
