import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';

export default function AMSLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('https://amsapitesting.scmcloud.online/api/Auth/login', {
        username,
        password,
      });

      console.log('Full Response:', response.data);

      if (response.data?.token) {
        // 🔹 Save token
        localStorage.setItem('accessToken', response.data.token);

        // 🔹 Save roleId safely
        const userInfo = response.data.userInfo;
        if (userInfo) {
          if (userInfo.roleId !== undefined) localStorage.setItem('roleId', userInfo.roleId);
          if (userInfo.userCode) localStorage.setItem('userCode', userInfo.userCode);
          if (userInfo.designation) localStorage.setItem('designation', userInfo.designation);
        }

        // redirect
        window.location.href = '/dashboard';
      } else {
        throw new Error('Invalid response: Token not found');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Axios specific error
      if (error.response) {
        console.error('Error Response Data:', error.response.data);
        console.error('Error Status:', error.response.status);
      } else {
        console.error('Error Message:', error.message);
      }

      setErrorMsg('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 🔹 Background Image */}
      <Box
        component="img"
        src="/logo/Amslogin.png"
        alt="Background"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          zIndex: -2,
        }}
      />

      {/* 🔹 Login Card */}
      <Paper
        elevation={6}
        sx={{
          width: { xs: '85%', sm: '320px' },
          p: 4,
          borderRadius: 4,
          textAlign: 'center',
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
        }}
      >
        {/* AMS Logo */}
        <Box sx={{ mb: 3 }}>
          <img src="/logo/AMSlogo.png" alt="AMS Logo" style={{ width: '140px', height: 'auto' }} />
        </Box>

        {/* Error */}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem' }}>
            {errorMsg}
          </Alert>
        )}

        {/* Email */}
        <TextField
          fullWidth
          variant="outlined"
          size="medium"
          placeholder="Enter your email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Password */}
        <TextField
          fullWidth
          type="password"
          variant="outlined"
          size="medium"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Forgot Password */}
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            mb: 3,
            cursor: 'pointer',
            color: 'primary.main',
            fontSize: '0.8rem',
          }}
        >
          Forgot Password?
        </Typography>

        {/* Login Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleLogin}
          disabled={loading}
          sx={{
            mb: 1,
            textTransform: 'none',
            fontSize: '0.95rem',
            py: 1.2,
            background: '#0E135A',
            '&:hover': { background: '#0b0f45' },
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Log In'}
        </Button>
      </Paper>
    </Box>
  );
}
