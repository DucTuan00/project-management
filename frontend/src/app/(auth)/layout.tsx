import { Home } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left side - Branding */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          width: '50%',
          backgroundColor: '#ff4f00',
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
        }}
      >
        <Box sx={{ maxWidth: '400px', textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <Home style={{ color: '#fffefb', fontSize: '28px' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#fffefb',
                fontSize: '30px',
              }}
            >
              PM Platform
            </Typography>
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#fffefb',
              mb: 2,
              fontSize: '24px',
            }}
          >
            Manage projects with ease
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#ffedd5',
              fontSize: '18px',
            }}
          >
            A modern project management platform for teams of all sizes.
            Track tasks, collaborate in real-time, and ship faster.
          </Typography>
        </Box>
      </Box>

      {/* Right side - Auth form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          backgroundColor: '#fffefb',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '448px' }}>
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#ff4f00',
              }}
            >
              <Home style={{ color: '#fffefb', fontSize: '24px' }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#201515',
                fontSize: '24px',
              }}
            >
              PM Platform
            </Typography>
          </Box>

          {children}
        </Box>
      </Box>
    </Box>
  );
}
