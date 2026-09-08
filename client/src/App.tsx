import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import Checkout, { ProductDetails } from "./pages/Checkout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/product/:slug" component={ProductDetails} />
    <Route path="/checkout/:slug" component={Checkout} />
    <Route path="/dashboard" component={BuyerDashboard} />
    <Route path="/admin" component={AdminDashboard} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
