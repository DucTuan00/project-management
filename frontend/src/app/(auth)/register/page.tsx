import { AuthProvider } from '@/providers/auth-provider';
import { RegisterForm } from '@/modules/auth/components/register-form';
import Typography from '@mui/material/Typography';

export default function RegisterPage() {
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
          Create an account
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#939084',
            mb: 4,
            fontSize: '16px',
          }}
        >
          Get started with PM Platform today
        </Typography>
        <RegisterForm />
      </div>
    </AuthProvider>
  );
}
