import { AuthProvider } from '@/providers/auth-provider';
import { LoginForm } from '@/modules/auth/components/login-form';
import Typography from '@mui/material/Typography';

export default function LoginPage() {
  return (
    <AuthProvider>
      <div>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#201515',
            fontSize: '24px',
            mb: 0.5,
          }}
        >
          Welcome back
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#939084',
            mb: 4,
            fontSize: '16px',
          }}
        >
          Sign in to your account to continue
        </Typography>
        <LoginForm />
      </div>
    </AuthProvider>
  );
}
