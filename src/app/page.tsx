
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Optimized Wiki loader using dynamic imports to prevent ChunkLoadErrors.
 * We use ssr: false to ensure the core documentation engine is only loaded on the client,
 * avoiding hydration mismatches and server-side timeouts in dev environments.
 */
const Wiki = dynamic(() => import('@/components/wiki/wiki'), {
  ssr: false,
  loading: () => <WikiLoadingSkeleton />
});

function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
      <div className="flex flex-col space-y-4 w-full max-w-6xl">
        <Skeleton className="h-12 w-[250px]" />
        <div className="flex space-x-4 h-[600px]">
          <Skeleton className="w-1/4 h-full" />
          <Skeleton className="w-3/4 h-full" />
        </div>
      </div>
    </div>
  );
}

function WikiLoadingSkeleton() {
  return <LoadingSkeleton />;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Root hydration guard to ensure consistent chunk loading in Cloud Workstation environments
  if (!mounted) {
    return <LoadingSkeleton />;
  }

  return <Wiki />;
}
