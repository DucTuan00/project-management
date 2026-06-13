import { AuthProvider } from '@/providers/auth-provider';
import { LoginForm } from '@/modules/auth/components/login-form';

export default function LoginPage() {
  return (
    <AuthProvider>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back
        </h1>
        <p className="text-gray-500 mb-8">
          Sign in to your account to continue
        </p>
        <LoginForm />
      </div>
    </AuthProvider>
  );
}
