type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

type AnalyticsWindow = Window & {
  umami?: { track: (eventName: string, payload?: AnalyticsPayload) => void };
};

export function trackEvent(eventName: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.umami?.track(eventName, payload);
}
