import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Checkbox,
    FormControlLabel,
    useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function AddUserPage() {
    const navigate = useNavigate();
    const theme = useTheme();

    // State for form fields
    const [formData, setFormData] = useState({
        userId: '',
        isActive: true, // Default to true based on check in screenshot
        password: '',
        userName: '',
        email: '',
        designation: 'Select',
    });

    const handleChange = (event) => {
        const { name, value, checked, type } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    return (
        <Box sx={{ width: '100%', mt: 4 }}>
            {/* 🔹 Header Section */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    color="black"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
                >
                    Add Users
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                    <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
                        •
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Power Tools
                    </Typography>
                    <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
                        •
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => navigate('/dashboard/power-tool/view-users')}
                    >
                        User Create View
                    </Typography>
                    <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
                        •
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Add Users
                    </Typography>
                </Box>
            </Box>

            {/* 🔹 Form Card */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3} maxWidth="md" sx={{ mx: 'auto' }}>

                        {/* User ID & Is Active */}
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ width: '100%', mr: 2 }}>
                                <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                    User ID
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleChange}
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ color: 'gray', mb: 0, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    Is Active
                                </Typography>
                                <Checkbox
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    name="isActive"
                                    size="small"
                                    sx={{ p: 0.5 }}
                                />
                            </Box>
                        </Grid>

                        {/* Password */}
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                Password
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                sx={{ backgroundColor: 'white' }}
                            />
                        </Grid>

                        {/* User Name */}
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                User Name
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                name="userName"
                                value={formData.userName}
                                onChange={handleChange}
                                sx={{ backgroundColor: 'white' }}
                            />
                        </Grid>

                        {/* Email */}
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                Email
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                sx={{ backgroundColor: 'white' }}
                            />
                        </Grid>

                        {/* Designation */}
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                Designation
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                variant="outlined"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                sx={{ backgroundColor: 'white' }}
                            >
                                <MenuItem value="Select">Select</MenuItem>
                                <MenuItem value="Shipment">Shipment</MenuItem>
                                <MenuItem value="Supplier">Supplier</MenuItem>
                                <MenuItem value="QA">QA</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Save Button */}
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="contained"
                                sx={{
                                    bgcolor: '#4a3b75',
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#382c5a' },
                                    minWidth: 150,
                                    height: 40
                                }}
                            >
                                Save
                            </Button>
                        </Grid>

                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
