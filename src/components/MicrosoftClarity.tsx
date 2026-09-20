'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';
import { useSession } from 'next-auth/react';

export default function MicrosoftClarity() {
  const { data: session } = useSession();

  useEffect(() => {
    const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

    if (clarityProjectId && typeof window !== 'undefined') {
      try {
        Clarity.init(clarityProjectId);
      } catch (err) {
        console.error('Error initializing Microsoft Clarity:', err);
      }
    }
  }, []);

  useEffect(() => {
    const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (!clarityProjectId || !session?.user) return;

    try {
      const user = session.user as {
        id?: string;
        name?: string | null;
        email?: string | null;
        role?: string;
        phone?: string;
      };

      const customId = user.id || user.email || user.phone;
      if (customId) {
        Clarity.identify(customId, undefined, undefined, user.name || undefined);
      }

      if (user.role) {
        Clarity.setTag('user_role', user.role);
      }
    } catch (err) {
      console.error('Error identifying user in Clarity:', err);
    }
  }, [session]);

  return null;
}
