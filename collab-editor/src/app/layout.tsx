import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

import Navbar from '@/components/Navbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>CollabEditor</title>
        <meta name="description" content="Collaborative document editing platform" />
      </head>
      <body>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            {/* <footer className="bg-gray-50 border-t border-gray-200 py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                  © {new Date().getFullYear()} CollabEditor. All rights reserved.
                </p>
              </div>
            </footer> */}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}