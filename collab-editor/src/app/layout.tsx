import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collaborative Document Editor',
  description: 'Real-time collaborative document editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}