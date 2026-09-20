import Clarity from '@microsoft/clarity';

/**
 * Identify a user in Microsoft Clarity session recordings.
 * @param customId Unique user identifier (e.g. user ID or email)
 * @param customSessionId Optional custom session identifier
 * @param customPageId Optional custom page identifier
 * @param friendlyName Optional human-readable name for easier filtering in Clarity dashboard
 */
export const identifyUser = (
  customId: string,
  customSessionId?: string,
  customPageId?: string,
  friendlyName?: string
) => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) {
    try {
      Clarity.identify(customId, customSessionId, customPageId, friendlyName);
    } catch (error) {
      console.error('Clarity identifyUser error:', error);
    }
  }
};

/**
 * Set custom key-value tags to filter and segment Clarity recordings and heatmaps.
 * @param key Tag key name
 * @param value String value or array of string values
 */
export const setClarityTag = (key: string, value: string | string[]) => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) {
    try {
      Clarity.setTag(key, value);
    } catch (error) {
      console.error('Clarity setTag error:', error);
    }
  }
};

/**
 * Track custom events in Microsoft Clarity for funnels and smart insights.
 * @param eventName Name of the action or milestone event
 */
export const trackClarityEvent = (eventName: string) => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) {
    try {
      Clarity.event(eventName);
    } catch (error) {
      console.error('Clarity trackEvent error:', error);
    }
  }
};

export { Clarity };
