'use client';

import { useState, useEffect } from 'react';

export function useGoogleMapsLoaded() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.maps) {
      setLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if ((window as any).google?.maps) {
        setLoaded(true);
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return loaded;
}
