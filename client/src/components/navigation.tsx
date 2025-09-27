import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Calendar, PawPrint, Users, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  // Don't show navigation on auth pages
  if (location === "/login" || location === "/register") {
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">PetCare Pro</span>
        </Link>

        <div className="flex items-center space-x-6 ml-auto">
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <Button variant="ghost" data-testid="nav-signin">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button data-testid="nav-register">Get Started</Button>
              </Link>
            </>
          ) : (
            <>
              {user?.userType === 'owner' && (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="hidden md:inline-flex" data-testid="nav-dashboard">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/booking">
                    <Button variant="ghost" className="hidden md:inline-flex" data-testid="nav-booking">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book
                    </Button>
                  </Link>
                  <Link href="/pets">
                    <Button variant="ghost" className="hidden md:inline-flex" data-testid="nav-pets">
                      <PawPrint className="mr-2 h-4 w-4" />
                      My Pets
                    </Button>
                  </Link>
                </>
              )}

              {user?.userType === 'clinic' && (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="hidden md:inline-flex" data-testid="nav-clinic-dashboard">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/appointments">
                    <Button variant="ghost" className="hidden md:inline-flex" data-testid="nav-appointments">
                      <Calendar className="mr-2 h-4 w-4" />
                      Appointments
                    </Button>
                  </Link>
                  <Link href="/patients">
                    <Button variant="ghost" className="hidden md:inline-flex" data-testid="nav-patients">
                      <Users className="mr-2 h-4 w-4" />
                      Patients
                    </Button>
                  </Link>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" data-testid="user-menu">
                    {user?.firstName} {user?.lastName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-testid="user-menu-content">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" data-testid="menu-dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
