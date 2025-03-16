"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect after auth state is confirmed and not already redirecting
    if (!loading && isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/documents');
    }
  }, [loading, isAuthenticated, router, isRedirecting]);

  // Show loading state while determining authentication
  if (loading || isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-64 bg-gray-200 rounded mb-8"></div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Show homepage content for non-authenticated users
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8">Collaborative Document Editor</h1>
      <div className="space-y-6">
        <p className="text-center text-gray-600 max-w-lg">
          Create, edit, and share documents in real-time with your team.
        </p>
        <div className="flex space-x-4 justify-center">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link 
            href="/signup" 
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}