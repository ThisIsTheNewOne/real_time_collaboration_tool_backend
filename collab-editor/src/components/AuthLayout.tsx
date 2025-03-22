import Link from "next/link";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showHomeLink?: boolean;
}

export default function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showHomeLink = true 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
          </div>
          
          {children}
        </div>
        
        {showHomeLink && (
          <div className="text-center mt-8">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              ← Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}