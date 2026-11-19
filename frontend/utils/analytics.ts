declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, params: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch {
    // Analytics errors must never break user flows
  }
}

export function trackPageView(pagePath: string, pageTitle?: string): void {
  trackEvent('page_view', {
    page_path: pagePath,
    ...(pageTitle ? { page_title: pageTitle } : {}),
  });
}

export function trackSignUp(method = 'phone_otp', sector?: string): void {
  trackEvent('sign_up', {
    method,
    ...(sector ? { sector } : {}),
  });
}

export function trackLogin(method = 'password'): void {
  trackEvent('login', { method });
}

export function trackDemoStart(source = 'landing'): void {
  trackEvent('demo_start', { source });
}

export function trackBookingCompleted(
  shopSlug: string,
  value: number,
  serviceName?: string
): void {
  trackEvent('booking_completed', {
    shop_slug: shopSlug,
    value,
    currency: 'TRY',
    ...(serviceName ? { service_name: serviceName } : {}),
  });
}

export function trackCtaClick(ctaLabel: string, ctaLocation: string): void {
  trackEvent('cta_click', {
    cta_label: ctaLabel,
    cta_location: ctaLocation,
  });
}
