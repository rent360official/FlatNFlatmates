/**
 * Cloudflare Turnstile Server-Side Token Verification
 * Protects OTP endpoints against automated bots & SMS credit draining attacks.
 */

export async function verifyTurnstileToken(
  token?: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured in environment, allow in development/fallback mode
  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Turnstile] CLOUDFLARE_TURNSTILE_SECRET_KEY is missing in production environment.');
    }
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      error: 'Bot verification token is missing. Please refresh and try again.',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await res.json();

    if (data.success) {
      return { success: true };
    }

    console.error('[Turnstile] Verification failed:', data);
    return {
      success: false,
      error: 'Security challenge failed. Please verify you are human and try again.',
    };
  } catch (err: any) {
    console.error('[Turnstile] Verification network error:', err);
    return {
      success: false,
      error: 'Security verification error. Please try again.',
    };
  }
}
