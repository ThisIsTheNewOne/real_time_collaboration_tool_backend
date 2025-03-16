'use client';

import DocumentEditor from '@/components/DocumentEditor';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';


export default function DocumentPage() {
  const params = useParams();
  const [token, setToken] = useState('');
  const documentId = params.id as string;
  
  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    } else {
      // Redirect to login if no token
      window.location.href = '/login';
    }
  }, []);
  
  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <DocumentEditor documentId={documentId} token={token} />
    </div>
  );
}