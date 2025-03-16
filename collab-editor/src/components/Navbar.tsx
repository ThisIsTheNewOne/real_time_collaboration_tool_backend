"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                CollabEditor
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {isAuthenticated && (
                <Link 
                  href="/documents" 
                  className={`${
                    pathname === '/documents' 
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  My Documents
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {loading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded-md"></div>
            ) : isAuthenticated ? (
              <div className="relative ml-3">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.email}
                  </div>
                  <button
                    onClick={logout}
                    className="bg-white hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Log in
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          {isAuthenticated && (
            <Link 
              href="/documents"
              className={`${
                pathname === '/documents' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              My Documents
            </Link>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {loading ? (
            <div className="animate-pulse h-8 mx-4 bg-gray-200 rounded-md"></div>
          ) : isAuthenticated ? (
            <div className="space-y-3 px-4">
              <div className="text-base font-medium text-gray-800">
                {user?.email}
              </div>
              <button
                onClick={logout}
                className="w-full flex justify-center bg-white hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="px-4">
              <Link
                href="/login"
                className="w-full flex justify-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}