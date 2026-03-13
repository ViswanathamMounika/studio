
'use client';

import React, { useState, useEffect } from 'react';
import Wiki from '@/components/wiki/wiki';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Home component serves as the entry point for the MedPoint Wiki.
 * We use a mounting gate (useEffect) instead of next/dynamic { ssr: false }
 * to resolve chunk loading errors in specific environments while still ensuring
 * the browser-heavy Wiki component only executes on the client.
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
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

  return <Wiki />;
}
