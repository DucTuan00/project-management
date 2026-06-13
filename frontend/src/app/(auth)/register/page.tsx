import { AuthProvider } from '@/providers/auth-provider';
import { RegisterForm } from '@/modules/auth/components/register-form';

export default function RegisterPage() {
  return (
    <AuthProvider>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create an account
        </h1>
        <p className="text-gray-500 mb-8">
          Get started with PM Platform today
        </p>
        <RegisterForm />
      </div>
    </AuthProvider>
  );
}
