'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition, useRef } from 'react';

export function CustomerSearch({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(initialSearch);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search to avoid too many navigation updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchValue) {
        params.set('search', searchValue);
      } else {
        params.delete('search');
      }
      
      // Only push if the search value has changed
      const newSearch = params.toString();
      const currentSearch = searchParams.get('search') || '';
      if (searchValue !== currentSearch) {
        startTransition(() => {
          router.push(`/customers?${newSearch}`);
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchValue, router, searchParams, startTransition]);

  // Restore focus after navigation
  useEffect(() => {
    if (!isPending && document.activeElement !== inputRef.current) {
      inputRef.current?.focus();
    }
  }, [isPending]);

  return (
    <div className="w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search by name or email..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        disabled={isPending}
      />
    </div>
  );
}
