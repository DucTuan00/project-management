import { Home } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Home className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">PM Platform</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Manage projects with ease
          </h2>
          <p className="text-lg text-primary-100">
            A modern project management platform for teams of all sizes.
            Track tasks, collaborate in real-time, and ship faster.
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
              <Home className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PM Platform</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
