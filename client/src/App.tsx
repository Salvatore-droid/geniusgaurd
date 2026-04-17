// src/App.tsx
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import QuickScan from "./pages/QuickScan";
import DeepScan from "./pages/DeepScan";
import Scans from "./pages/Scans";
import ScanDetail from "./pages/ScanDetail";
import ScheduledScans from "./pages/ScheduledScans";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/docs" component={Docs} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/quick-scan" component={QuickScan} />
      <ProtectedRoute path="/deep-scan" component={DeepScan} />
      <ProtectedRoute path="/scans" component={Scans} />
      <ProtectedRoute path="/scan/:id" component={ScanDetail} />
      <ProtectedRoute path="/scheduled-scans" component={ScheduledScans} />
      <ProtectedRoute path="/threat-intelligence" component={ThreatIntelligence} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* 404 route */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <TooltipProvider>
            <ToastProvider>
              <Toaster />
              <Router />
            </ToastProvider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
