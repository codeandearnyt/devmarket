import { trpc } from "@/lib/trpc";
import { trackEvent as trackUmami } from "@/lib/analytics";
import { useCallback } from "react";

type EventName = "catalog_filter_changed" | "article_view";
type EventMetadata = Record<string, string | number | boolean>;

export function useAnalyticsEvent() {
  const { mutate } = trpc.analytics.track.useMutation();
  return useCallback((eventName: EventName, metadata?: EventMetadata) => {
    trackUmami(eventName, metadata);
    mutate({ eventName, path: typeof window === "undefined" ? undefined : window.location.pathname, metadata });
  }, [mutate]);
}
