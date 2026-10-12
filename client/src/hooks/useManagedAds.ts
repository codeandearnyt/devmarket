import { useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { adsForSlot, managedHeadTags, type ManagedAd } from "@/lib/managedAds";

/**
 * Load the active managed ads a blog page needs, and install the account-level
 * AdSense loader.
 *
 * Inventory is read per slot because `activeAdsBySlot` is a public read-only
 * endpoint: a slot with no active rows simply returns `[]`, and the template
 * falls back to the built-in house creatives. Queries are cached for a minute
 * — inventory changes only from the admin console, and every slot on the page
 * needs the same set.
 *
 * The `adsbygoogle.js` loader is injected once per page from whichever active
 * ad configured a client id. Without it a pasted `<ins>` renders but never
 * fills, which looks like a broken ad to the operator.
 */
export function useManagedAds() {
  const sidebar = trpc.admin.activeAdsBySlot.useQuery({ slot: "sidebar" }, { staleTime: 60_000 });
  const inArticle = trpc.admin.activeAdsBySlot.useQuery({ slot: "in-article" }, { staleTime: 60_000 });

  const ads = useMemo<ManagedAd[]>(
    () => [...(sidebar.data ?? []), ...(inArticle.data ?? [])] as ManagedAd[],
    [sidebar.data, inArticle.data],
  );

  useAdSenseLoader(ads);

  return {
    ads,
    sidebar: adsForSlot(ads, "sidebar"),
    inArticle: adsForSlot(ads, "in-article"),
    isLoading: sidebar.isLoading || inArticle.isLoading,
  };
}

/**
 * Ensure the AdSense runtime script is present.
 *
 * Each configured tag is de-duplicated by `src` (the same loader may be pasted
 * on several slots) and the nodes are removed on unmount so navigating between
 * articles does not stack duplicates.
 */
function useAdSenseLoader(ads: ManagedAd[]) {
  const sources = useMemo(
    () =>
      managedHeadTags(ads)
        .map(markup => markup.match(/<script[^>]*\ssrc\s*=\s*"([^"]+)"/i)?.[1])
        .filter((src): src is string => Boolean(src)),
    [ads],
  );

  useEffect(() => {
    if (!sources.length) return;
    const created: HTMLScriptElement[] = [];
    for (const src of Array.from(new Set(sources))) {
      if (document.querySelector(`script[src="${src}"]`)) continue;
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
      created.push(script);
    }
    return () => created.forEach(node => node.remove());
  }, [sources]);
}