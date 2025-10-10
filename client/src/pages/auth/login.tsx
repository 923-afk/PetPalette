import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const handleDemoLogin = async (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
    
    // Ensure demo data is initialized before login
    try {
      await fetch('/api/demo/init', { method: 'POST' });
    } catch (error) {
      console.log('Demo data initialization failed:', error);
    }
    
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl" data-testid="login-card">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">PetCare Pro</span>
          </div>
          <CardTitle className="text-xl" data-testid="login-title">Welcome back!</CardTitle>
          <p className="text-muted-foreground">Sign in to your account to continue</p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Demo Accounts */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm font-medium mb-2 text-center">Demo Accounts</div>
            <div className="grid gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin("owner.demo@example.com", "demo1234")}
                disabled={loginMutation.isPending}
                data-testid="demo-owner-button"
                className="justify-start"
              >
                <div>
                  <div className="font-medium text-sm">Pet Owner Demo</div>
                  <div className="text-xs text-muted-foreground">owner.demo@example.com</div>
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin("clinic.demo@example.com", "demo1234")}
                disabled={loginMutation.isPending}
                data-testid="demo-clinic-button"
                className="justify-start"
              >
                <div>
                  <div className="font-medium text-sm">Veterinary Clinic Demo</div>
                  <div className="text-xs text-muted-foreground">clinic.demo@example.com</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...form.register("email")}
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive" data-testid="error-email">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...form.register("password")}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive" data-testid="error-password">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="submit-login"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <div className="p-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium" data-testid="link-register">
              Sign up for free
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
