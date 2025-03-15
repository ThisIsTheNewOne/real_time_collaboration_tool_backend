'use client';

import { useEffect, useState, useRef, SetStateAction } from 'react';
import { io, Socket } from 'socket.io-client';

interface DocumentEditorProps {
  documentId: string;
  token: string;
}

export default function DocumentEditor({ documentId, token }: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const [connected, setConnected] = useState(false);
  const [title, setTitle] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState('Connecting...');
  
  useEffect(() => {
    // Create socket connection
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      setConnected(true);
      setStatus('Connected');
      console.log('Socket connected');
      
      // Join the document
      socket.emit('join-document', documentId, token);
    });
    
    socket.on('error', (error: any) => {
      setStatus(`Error: ${error}`);
      console.error('Socket error:', error);
    });
    
    socket.on('document-content', (data: { content: any; title: any; }) => {
      console.log('Document loaded:', data);
      setContent(data.content || '');
      setTitle(data.title || '');
      setStatus('Document loaded');
    });
    
    socket.on('text-change', (delta: { content: SetStateAction<string>; }) => {
      console.log('Received text change:', delta);
      // Only update if the change is from another user
      setContent(delta.content);
    });
    
    socket.on('disconnect', () => {
      setConnected(false);
      setStatus('Disconnected');
    });
    
    return () => {
      socket.disconnect();
    };
  }, [documentId, token]);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Send changes to server
    if (socketRef.current) {
      socketRef.current.emit('text-change', {
        title,
        content: newContent
      });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-semibold">{title || 'Untitled Document'}</h1>
          <p className="text-sm text-gray-500">{status}</p>
        </div>
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <textarea
        className="flex-1 p-4 w-full resize-none focus:outline-none border-0"
        value={content}
        onChange={handleContentChange}
        placeholder="Start writing..."
      />
    </div>
  );
}