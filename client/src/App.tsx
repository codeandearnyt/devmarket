import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingAnimation from "./components/LoadingAnimation";
import SplashScreen from "./components/SplashScreen";
import { ThemeProvider } from "./contexts/ThemeContext";

// The 404 page is lazy too. It renders the site header, which reaches for the
// auth hook and therefore for the Firebase SDK — keeping it eager dragged the
// whole auth bundle into the entry chunk for a page almost nobody sees.
const NotFound = lazy(() => import("./pages/NotFound"));

// Every route is lazy, including the landing page. The landing page used to be
// eagerly imported because three other pages pulled the price formatters from
// it; those now live in `lib/format`, so the entry bundle no longer carries the
// whole catalogue section.
const Home = lazy(() => import("./pages/Home"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const BuyerDashboard = lazy(() => import("./pages/BuyerDashboard"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ProductDetails = lazy(() => import("./pages/Checkout").then(module => ({ default: module.ProductDetails })));
const Developer = lazy(() => import("./pages/Developer"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/ProfilePage"));

/**
 * Hard cap on how long the splash may stay up.
 *
 * The splash normally clears as soon as the route below it mounts. This exists
 * only so a failed or very slow chunk can never leave a full-screen logo sitting
 * there — past this point the user sees the route fallback, which is at least
 * honest about what is happening.
 */
const SPLASH_MAX_MS = 1200;
/** Must outlast the splash's own exit animation, or it unmounts mid-fade. */
const SPLASH_UNMOUNT_MS = 320;

function RouteFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#eef8fa]">
      <LoadingAnimation size={132} className="-ml-[5px]" label="Loading DevMarket" />
      <p className="animate-[pulse_1.6s_ease-in-out_infinite] font-mono text-[11px] uppercase tracking-[.28em] text-[#13b8b0]">
        Loading DevMarket
      </p>
    </div>
  );
}

/**
 * Mounts only once the suspended route has resolved.
 *
 * Suspense withholds its entire children subtree until a lazy child suspends no
 * more, so this null component is a reliable "real page content is committed"
 * signal — which is exactly when the splash should get out of the way.
 */
function ReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

function Router({ onReady }: { onReady: () => void }) {
  return (
    <WouterRouter>
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/product/:slug" component={ProductDetails} />
          <Route path="/checkout/:slug" component={Checkout} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogArticle} />
          <Route path="/dashboard" component={BuyerDashboard} />
          <Route path="/developer" component={Developer} />
          <Route path="/about" component={InfoPage} />
          <Route path="/privacy" component={InfoPage} />
          <Route path="/terms" component={InfoPage} />
          <Route path="/contact" component={InfoPage} />
          <Route path="/login" component={Login} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
        <ReadySignal onReady={onReady} />
      </Suspense>
    </WouterRouter>
  );
}

export default function App() {
  // "in" -> "out" (fade playing) -> "done" (unmounted).
  const [splashState, setSplashState] = useState<"in" | "out" | "done">("in");

  const finish = useCallback(() => {
    setSplashState(current => (current === "in" ? "out" : current));
  }, []);

  useEffect(() => {
    const cap = setTimeout(finish, SPLASH_MAX_MS);
    return () => clearTimeout(cap);
  }, [finish]);

  // Drop it entirely once the fade is done, so it stops compositing.
  useEffect(() => {
    if (splashState !== "out") return;
    const done = setTimeout(() => setSplashState("done"), SPLASH_UNMOUNT_MS);
    return () => clearTimeout(done);
  }, [splashState]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {/* The router mounts immediately and renders underneath. The splash is a
              cover over it, never a gate in front of it — which is the whole
              point: it used to hold the entire app back for five seconds. */}
          <Router onReady={finish} />
          {splashState !== "done" ? <SplashScreen exiting={splashState === "out"} /> : null}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}