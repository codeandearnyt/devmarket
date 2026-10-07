import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingAnimation from "./components/LoadingAnimation";
import SplashScreen from "./components/SplashScreen";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const BuyerDashboard = lazy(() => import("./pages/BuyerDashboard"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ProductDetails = lazy(() => import("./pages/Checkout").then(module => ({ default: module.ProductDetails })));
const Developer = lazy(() => import("./pages/Developer"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const Login = lazy(() => import("./pages/Login"));

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

function Router() {
  return <WouterRouter><Suspense fallback={<RouteFallback />}><Switch>
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
    <Route path="/admin" component={AdminDashboard} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></Suspense></WouterRouter>;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    // Optionally trigger splash only once per session
    const shown = sessionStorage.getItem("devmarket_splash");
    if (shown) setSplashDone(true);
  }, []);
  const handleSplashComplete = () => {
    setSplashDone(true);
    sessionStorage.setItem("devmarket_splash", "1");
  };
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
          {splashDone && <Router />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
