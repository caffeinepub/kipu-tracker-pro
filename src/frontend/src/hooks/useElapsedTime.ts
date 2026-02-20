import { useState, useEffect } from 'react';
import { formatElapsedTime } from '@/utils/timeHelpers';

/**
 * Custom hook that calculates and returns elapsed time from a start timestamp.
 * Updates every second while a valid start time is provided.
 * 
 * @param startTime - Start time in milliseconds (Date.now() format) or null
 * @returns Formatted elapsed time string in HH:MM:SS format
 */
export function useElapsedTime(startTime: number | null): string {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsedSeconds(0);
      return;
    }

    // Calculate initial elapsed time
    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    // Update immediately
    updateElapsed();

    // Then update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return formatElapsedTime(elapsedSeconds);
}
