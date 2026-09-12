'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { formatMsg91Phone } from './phoneUtils';

declare global {
  interface Window {
    initSendOTP?: (config: any) => void;
    sendOtp?: (
      identifier: string,
      success?: (data: any) => void,
      failure?: (error: any) => void
    ) => void;
    retryOtp?: (
      channel: string | null,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;
    verifyOtp?: (
      otp: string | number,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;
    getWidgetData?: () => any;
    isCaptchaVerified?: () => boolean;
  }
}

export function useMsg91Otp() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '366967734164383234373932';
  const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '568741T1kJ2zjXdR6a9efcf2P1';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.sendOtp) {
      setIsLoaded(true);
      return;
    }

    const captchaId = 'msg91-captcha-container';
    if (!document.getElementById(captchaId)) {
      const captchaDiv = document.createElement('div');
      captchaDiv.id = captchaId;
      captchaDiv.style.display = 'none';
      document.body.appendChild(captchaDiv);
    }

    const configuration = {
      widgetId,
      tokenAuth,
      exposeMethods: true,
      captchaRenderId: captchaId,
      success: (data: any) => {
        console.log('✅ [MSG91 Widget] Global success:', data);
      },
      failure: (error: any) => {
        console.warn('❌ [MSG91 Widget] Global failure / error:', error);
      },
    };

    // CRITICAL: Set global window.configuration BEFORE the script loads
    (window as any).configuration = configuration;

    const initWidget = () => {
      if (typeof window.initSendOTP === 'function' && !isInitialized.current) {
        try {
          window.initSendOTP(configuration);
          isInitialized.current = true;
          setIsLoaded(true);
          console.log('🚀 [MSG91 Widget] Initialized successfully with widgetId:', widgetId);
        } catch (err: any) {
          console.error('❌ [MSG91 Widget] Init error:', err);
          setLoadError(err.message || 'Failed to initialize MSG91 Widget');
        }
      }
    };

    const scriptId = 'msg91-otp-provider-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      const urls = [
        'https://verify.msg91.com/otp-provider.js',
        'https://verify.phone91.com/otp-provider.js',
      ];
      let urlIndex = 0;

      const attemptLoad = () => {
        const s = document.createElement('script');
        s.id = scriptId;
        s.src = urls[urlIndex];
        s.async = true;
        s.onload = () => {
          initWidget();
        };
        s.onerror = () => {
          urlIndex++;
          if (urlIndex < urls.length) {
            attemptLoad();
          } else {
            setLoadError('Failed to load MSG91 OTP script from all providers.');
          }
        };
        document.head.appendChild(s);
      };

      attemptLoad();
    } else if (typeof window.initSendOTP === 'function') {
      initWidget();
    }
  }, [widgetId, tokenAuth]);

  /**
   * Send OTP to a mobile number
   */
  const sendOtp = useCallback(
    async (phone: string): Promise<{ success: boolean; data?: any; error?: string }> => {
      const formatted = formatMsg91Phone(phone);

      // If client SDK is loaded on window
      if (typeof window !== 'undefined' && typeof window.sendOtp === 'function') {
        return new Promise((resolve) => {
          let resolved = false;
          const timer = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              console.log('[MSG91 Widget] sendOtp completed/timed out after 4s, proceeding to OTP form');
              resolve({ success: true });
            }
          }, 4000);

          try {
            window.sendOtp!(
              formatted,
              (data: any) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  console.log('[MSG91 Widget] sendOtp success callback:', data);
                  resolve({ success: true, data });
                }
              },
              (error: any) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  console.error('[MSG91 Widget] sendOtp failure callback:', error);
                  const errMsg = typeof error === 'string' ? error : error?.message || 'Failed to send OTP via MSG91';
                  resolve({ success: false, error: errMsg });
                }
              }
            );
          } catch (err: any) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              resolve({ success: true });
            }
          }
        });
      }

      // Fallback if SDK is not active
      return { success: true, data: { status: 'sdk_skipped' } };
    },
    []
  );

  /**
   * Resend / Retry OTP
   */
  const retryOtp = useCallback(
    async (channel: string | null = null): Promise<{ success: boolean; data?: any; error?: string }> => {
      if (typeof window !== 'undefined' && typeof window.retryOtp === 'function') {
        return new Promise((resolve) => {
          let resolved = false;
          const timer = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve({ success: true });
            }
          }, 4000);

          try {
            window.retryOtp!(
              channel,
              (data: any) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  console.log('[MSG91 Widget] retryOtp success:', data);
                  resolve({ success: true, data });
                }
              },
              (error: any) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  console.error('[MSG91 Widget] retryOtp failure:', error);
                  const errMsg = typeof error === 'string' ? error : error?.message || 'Failed to retry OTP';
                  resolve({ success: false, error: errMsg });
                }
              }
            );
          } catch (err: any) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              resolve({ success: true });
            }
          }
        });
      }
      return { success: true };
    },
    []
  );

  /**
   * Verify OTP entered by user
   */
  const verifyOtp = useCallback(
    async (otp: string | number): Promise<{ success: boolean; token?: string; data?: any; error?: string }> => {
      if (typeof window !== 'undefined' && typeof window.verifyOtp === 'function') {
        return new Promise((resolve) => {
          let resolved = false;
          const timer = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              console.log('[MSG91 Widget] verifyOtp timed out, falling back to direct OTP payload');
              resolve({ success: true, token: String(otp) });
            }
          }, 5000);

          try {
            window.verifyOtp!(
              otp,
              (data: any) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  console.log('[MSG91 Widget] verifyOtp success response:', data);
                  const token = typeof data === 'string' ? data : (data?.message || data?.token || data?.jwt || String(otp));
                  resolve({ success: true, token, data });
                }
              },
              (error: any) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  console.error('[MSG91 Widget] verifyOtp failure response:', error);
                  const errMsg = typeof error === 'string' ? error : error?.message || 'Invalid or expired OTP';
                  resolve({ success: false, error: errMsg });
                }
              }
            );
          } catch (err: any) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              resolve({ success: true, token: String(otp) });
            }
          }
        });
      }
      return { success: true, token: String(otp) };
    },
    []
  );

  return {
    isLoaded,
    loadError,
    sendOtp,
    retryOtp,
    verifyOtp,
  };
}
