'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3ee0b0', contrastText: '#06221a' },
    secondary: { main: '#8eb6ff' },
    error: { main: '#ff6b81' },
    warning: { main: '#e6b35a' },
    success: { main: '#3ee0b0' },
    background: {
      default: '#0b0f14',
      paper: '#161d27',
    },
    text: {
      primary: '#d5dee8',
      secondary: '#8b9aab',
    },
    divider: 'rgba(158, 186, 214, 0.16)',
  },
  typography: {
    fontFamily: 'var(--font-manrope), "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b0f14',
          color: '#d5dee8',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#0c1218',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(158, 186, 214, 0.28)',
        },
      },
    },
  },
});
