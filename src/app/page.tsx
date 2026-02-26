
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the main Wiki component to reduce initial bundle size
// We use ssr: false here because the Wiki component relies heavily on browser APIs
// and local storage which are not available during server-side rendering.
const Wiki = dynamic(() => import('@/components/wiki/wiki'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
      <div className="flex flex-col space-y-4 w-full max-w-6xl">
        <Skeleton className="h-12 w-[250px]" />
        <div className="flex space-x-4 h-[600px]">
          <Skeleton className="w-1/4 h-full" />
          <Skeleton className="w-3/4 h-full" />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <Wiki />;
}
