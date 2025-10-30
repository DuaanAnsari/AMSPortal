import * as Yup from 'yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'src/utils/axios';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';

import { useRouter, useSearchParams } from 'src/routes/hooks';
import { useBoolean } from 'src/hooks/use-boolean';
import { PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function JwtLoginView() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const password = useBoolean();

  const LoginSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
  });

  const defaultValues = {
    username: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // ✅ Global axios instance use kar rahe hain (baseURL + interceptors)
      const response = await axiosInstance.post('/api/Auth/login', {
        username: data.username,
        password: data.password,
      });

      // ✅ Agar token mila to store karke redirect karo
      if (response.data && response.data.token) {
        localStorage.setItem('accessToken', response.data.token);

        const target = returnTo ? decodeURIComponent(returnTo) : PATH_AFTER_LOGIN;
        router.push(target);
      } else {
        throw new Error('Invalid response: Token not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      reset();
      setErrorMsg('Invalid username or password');
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'shine 6s infinite linear',
        },
        '@keyframes shine': {
          '0%': { transform: 'rotate(0deg) translate(-10%, -10%)' },
          '100%': { transform: 'rotate(360deg) translate(-10%, -10%)' },
        },
      }}
    >
      {/* Floating Glass Bubbles */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(40px)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '30%',
          right: '15%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(30px)',
          animation: 'float 8s ease-in-out infinite 2s',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          left: '20%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(25px)',
          animation: 'float 7s ease-in-out infinite 1s',
        }}
      />

      {/* Main Glass Container */}
      <Paper
        sx={{
          width: '100%',
          maxWidth: 420,
          padding: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 3,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
            zIndex: -1,
          },
        }}
      >
        {/* Header */}
        <Stack spacing={2} sx={{ mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto 16px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="white">
              AMS
            </Typography>
          </Box>

          <Typography
            variant="h4"
            fontWeight="bold"
            color="white"
            sx={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
            Sign in to your account
          </Typography>
        </Stack>

        {!!errorMsg && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {errorMsg}
          </Alert>
        )}

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack spacing={3}>
            {/* Username Field */}
            <RHFTextField
              name="username"
              label="Username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify
                      icon="mdi:account"
                      width={20}
                      height={20}
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
              }}
            />

            {/* Password Field */}
            <RHFTextField
              name="password"
              label="Password"
              type={password.value ? 'text' : 'password'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify
                      icon="mdi:lock"
                      width={20}
                      height={20}
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={password.onToggle}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      <Iconify
                        icon={password.value ? 'mdi:eye' : 'mdi:eye-off'}
                        width={20}
                        height={20}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
              }}
            />

            {/* Glass Login Button */}
            <LoadingButton
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              loading={isSubmitting}
              sx={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 'bold',
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)',
                  boxShadow: '0 6px 25px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)',
                  '&::before': {
                    left: '100%',
                  },
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.MuiLoadingButton-loading': {
                  color: 'white',
                },
              }}
            >
              Sign In
            </LoadingButton>
          </Stack>
        </FormProvider>

        {/* Footer */}
        <Typography
          variant="caption"
          color="rgba(255, 255, 255, 0.6)"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          Secure Access • Asset Management System
        </Typography>
      </Paper>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
    </Box>
  );
}
