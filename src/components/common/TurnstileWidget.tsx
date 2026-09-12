'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  action?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (error: string) => void;
          'expired-callback'?: () => void;
          action?: string;
          theme?: 'auto' | 'light' | 'dark';
          size?: 'normal' | 'compact' | 'flexible' | 'invisible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({
  onVerify,
  onError,
  action = 'otp_request',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  const renderWidget = () => {
    if (!siteKey) {
      // In development without Turnstile configured, bypass gracefully
      onVerify('');
      return;
    }

    if (window.turnstile && containerRef.current && !widgetIdRef.current) {
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          size: 'flexible',
          theme: 'light',
          callback: (token: string) => {
            onVerify(token);
          },
          'error-callback': (err: string) => {
            if (onError) onError(err);
          },
          'expired-callback': () => {
            onVerify('');
          },
        });
        widgetIdRef.current = id;
      } catch (e) {
        console.error('Turnstile render error:', e);
      }
    }
  };

  useEffect(() => {
    if (!siteKey) {
      onVerify('');
      return;
    }
    if (window.turnstile) {
      renderWidget();
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {}
      }
    };
  }, [siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onLoad={renderWidget}
      />
      <div ref={containerRef} className="my-2 flex justify-center min-h-[65px]" />
    </>
  );
}
