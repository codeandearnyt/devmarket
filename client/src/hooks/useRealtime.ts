import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

type RealtimeScope = "storefront" | "buyer" | "admin";

export function useRealtime(scope: RealtimeScope) {
  const utils = trpc.useUtils();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let disposed = false;
    const invalidateCatalog = () => {
      void utils.catalog.featured.invalidate();
      void utils.catalog.products.invalidate();
      void utils.catalog.categories.invalidate();
    };
    const invalidateBlog = () => { void utils.blog.list.invalidate(); };
    const invalidateOrders = () => {
      if (scope === "buyer" || scope === "admin") void utils.orders.myOrders.invalidate();
      if (scope === "admin") {
        void utils.admin.orders.invalidate();
        void utils.admin.stats.invalidate();
        void utils.admin.products.invalidate();
      }
    };
    const source = new EventSource("/api/realtime");
    const onReady = () => { if (!disposed) setConnected(true); };
    const onCatalog = () => invalidateCatalog();
    const onOrder = () => invalidateOrders();
    const onPayment = () => invalidateOrders();
    const onBlog = () => invalidateBlog();
    source.addEventListener("ready", onReady);
    source.addEventListener("catalog.updated", onCatalog);
    source.addEventListener("order.updated", onOrder);
    source.addEventListener("payment.updated", onPayment);
    source.addEventListener("blog.updated", onBlog);
    source.onerror = () => { if (!disposed) setConnected(false); };
    const fallback = window.setInterval(() => {
      invalidateCatalog();
      invalidateBlog();
      if (scope !== "storefront") invalidateOrders();
    }, 30_000);
    return () => {
      disposed = true;
      window.clearInterval(fallback);
      source.close();
    };
  }, [scope, utils]);

  return connected;
}
