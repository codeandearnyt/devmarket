import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
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

function useDevMarketLocation() {
  const [location, navigate] = useHashLocation();
  const pathLocation = window.location.pathname !== "/" ? window.location.pathname : location;
  const sectionHash = pathLocation === "/explore" || pathLocation === "/how-it-works";
  return [sectionHash ? "/" : pathLocation, navigate] as [string, typeof navigate];
}

function Router() {
  return <WouterRouter hook={useDevMarketLocation}><Suspense fallback={<div className="min-h-screen bg-[#eef8fa] p-10 font-mono text-xs uppercase tracking-[.16em] text-[#13b8b0]">Loading DevMarket…</div>}><Switch>
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
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
