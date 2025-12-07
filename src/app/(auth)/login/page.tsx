'use client';

import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md animate-pulse">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded mt-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-blue-200 rounded mt-6"></div>
        </div>
      </div>
    </div>
  );
}