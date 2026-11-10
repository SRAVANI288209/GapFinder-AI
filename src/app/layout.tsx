import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GapFinder AI – Find What the Student Doesn’t Know',
  description:
    'Diagnostic learning intelligence that analyzes study materials, maps syllabus concepts, identifies weak topics through diagnostic quizzes, and builds personalized revision schedules.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
