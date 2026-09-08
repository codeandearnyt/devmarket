import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import Checkout, { ProductDetails } from "./pages/Checkout";
import Developer from "./pages/Developer";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function useDevMarketLocation() {
  const [location, navigate] = useHashLocation();
  const sectionHash = location === "/explore" || location === "/how-it-works";
  return [sectionHash ? "/" : location, navigate] as [string, typeof navigate];
}

function Router() {
  return <WouterRouter hook={useDevMarketLocation}><Switch>
    <Route path="/" component={Home} />
    <Route path="/product/:slug" component={ProductDetails} />
    <Route path="/checkout/:slug" component={Checkout} />
    <Route path="/dashboard" component={BuyerDashboard} />
    <Route path="/developer" component={Developer} />
    <Route path="/admin" component={AdminDashboard} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></WouterRouter>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
