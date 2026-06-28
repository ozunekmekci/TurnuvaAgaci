'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { decodeUserPicks } from './decode';
import { encodeUserPicks } from './encode';
import { RealMatch } from '../bracket/types';

/**
 * Custom React hook to manage user picks state and sync it with the URL.
 * Automatically handles serialization/deserialization and compresses search parameters.
 *
 * @param realData The real tournament match data (used to filter out locked matches from the URL)
 */
export function useUserPicks(realData: RealMatch[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get raw compressed parameter from URL
  const pParam = searchParams.get('p');

  // Local state for user picks
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});

  // Synchronize state with URL param on mount and when URL param changes
  useEffect(() => {
    const decoded = decodeUserPicks(pParam);
    setUserPicks(decoded);
  }, [pParam]);

  // Update pick function
  const updatePick = useCallback(
    (matchId: string, teamId: string) => {
      setUserPicks((prev) => {
        const next = { ...prev, [matchId]: teamId };

        // Encode and update URL in a transition to avoid locking the UI thread
        const compressed = encodeUserPicks(next, realData);
        const params = new URLSearchParams(searchParams.toString());
        if (compressed) {
          params.set('p', compressed);
        } else {
          params.delete('p');
        }

        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });

        return next;
      });
    },
    [pathname, router, searchParams, realData]
  );

  const resetPicks = useCallback(() => {
    setUserPicks({});
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return {
    userPicks,
    updatePick,
    resetPicks,
    isUpdating: isPending,
  };
}
