import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Calendar, FileText, Video, Ambulance, PawPrint, TrendingUp, CheckCircle, Play, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
        <div className="container relative mx-auto px-4 max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" data-testid="hero-title">
                  Modern Pet Care,
                  <span className="text-primary"> Simplified</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg" data-testid="hero-description">
                  Connect with trusted veterinarians, manage your pet's health records, and book appointments seamlessly. Everything your pet needs, in one place.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8" data-testid="cta-book-appointment">
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Appointment
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-12 px-8" data-testid="cta-watch-demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-8 pt-8 border-t">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary" data-testid="stat-clinics">500+</div>
                  <div className="text-sm text-muted-foreground">Trusted Clinics</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary" data-testid="stat-pets">50K+</div>
                  <div className="text-sm text-muted-foreground">Happy Pets</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent" data-testid="stat-support">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                  alt="Modern veterinary clinic with professional examination" 
                  className="w-full h-auto"
                  data-testid="hero-image"
                />
                
                {/* Floating appointment card */}
                <div className="absolute -bottom-6 -left-6 bg-card border rounded-xl p-4 shadow-lg max-w-sm" data-testid="floating-card">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-card-foreground">Appointment Confirmed</div>
                      <div className="text-sm text-muted-foreground">Today at 2:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="features-title">
              Everything for Your Pet's Health
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="features-description">
              Comprehensive pet care management designed for modern pet owners and veterinary professionals.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-all" data-testid="feature-smart-booking">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI-powered appointment scheduling with real-time availability and automatic reminders.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all" data-testid="feature-health-records">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Digital Health Records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Complete medical history, vaccination tracking, and secure document storage.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all" data-testid="feature-telemedicine">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Virtual Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with veterinarians remotely for quick consultations and follow-ups.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all" data-testid="feature-emergency">
              <CardHeader>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                  <Ambulance className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle>Emergency Care</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  24/7 emergency support with instant clinic location and urgent care booking.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all" data-testid="feature-multi-pet">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <PawPrint className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multi-Pet Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage multiple pets with individual profiles, schedules, and health tracking.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all" data-testid="feature-analytics">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Health Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced insights and trends to keep your pets healthy and happy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="cta-title">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="cta-description">
              Join thousands of pet owners and veterinary clinics who trust PetCare Pro for their pet care needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8" data-testid="cta-get-started">
                  <Heart className="mr-2 h-5 w-5" />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 px-8" data-testid="cta-sign-in">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">PetCare Pro</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Modern pet care management for veterinarians and pet owners. Trusted by thousands worldwide.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Pet Owners</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Find Veterinarians</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Book Appointments</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Health Records</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Emergency Care</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Clinics</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Practice Management</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Appointment Scheduling</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Patient Records</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Analytics & Reports</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 PetCare Pro. All rights reserved. Made with ❤️ for pets and their families.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
