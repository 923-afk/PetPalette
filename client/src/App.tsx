import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import OwnerDashboard from "@/pages/owner/dashboard";
import OwnerBooking from "@/pages/owner/booking";
import OwnerPets from "@/pages/owner/pets";
import PetProfile from "@/pages/owner/pet-profile";
import ClinicDashboard from "@/pages/clinic/dashboard";
import ClinicAppointments from "@/pages/clinic/appointments";
import ClinicPatients from "@/pages/clinic/patients";
import Navigation from "@/components/navigation";
import NotFound from "@/pages/not-found";
import Chatbot from "@/components/ui/chatbot";

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/register';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Global Chatbot */}
      {!isAuthPage && <Chatbot />}
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Owner routes */}
        {isAuthenticated && user?.userType === 'owner' && (
          <>
            <Route path="/dashboard" component={OwnerDashboard} />
            <Route path="/booking" component={OwnerBooking} />
            <Route path="/pets" component={OwnerPets} />
            <Route path="/pets/:id" component={PetProfile} />
          </>
        )}

        {/* Clinic routes */}
        {isAuthenticated && user?.userType === 'clinic' && (
          <>
            <Route path="/dashboard" component={ClinicDashboard} />
            <Route path="/appointments" component={ClinicAppointments} />
            <Route path="/patients" component={ClinicPatients} />
          </>
        )}

        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
