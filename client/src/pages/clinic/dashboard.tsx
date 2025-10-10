import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import AppointmentCard from "@/components/appointment-card";
import { Appointment, Pet, Clinic } from "@shared/schema";
import { Calendar, Users, DollarSign, AlertTriangle, Search, Plus, BarChart3, Stethoscope, Pill, Syringe } from "lucide-react";
import { Link } from "wouter";

export default function ClinicDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clinic, isLoading: clinicLoading } = useQuery({
    queryKey: ['/api/clinics/my'],
    queryFn: async () => {
      const response = await fetch('/api/clinics/my', {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to fetch clinic');
      return response.json();
    },
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments', {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['/api/pets'],
    queryFn: async () => {
      const response = await fetch('/api/pets');
      if (!response.ok) throw new Error('Failed to fetch pets');
      return response.json();
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiRequest("PUT", `/api/appointments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Appointment updated",
        description: "The appointment status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update appointment.",
        variant: "destructive",
      });
    },
  });

  const todayAppointments = appointments.filter((apt: Appointment) => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate.toDateString() === today.toDateString();
  });

  const upcomingAppointments = todayAppointments.filter((apt: Appointment) => 
    ['pending', 'confirmed', 'in-progress'].includes(apt.status)
  );

  const completedToday = todayAppointments.filter((apt: Appointment) => 
    apt.status === 'completed'
  );

  const urgentCases = appointments.filter((apt: Appointment) => 
    apt.serviceType.toLowerCase().includes('emergency') || apt.reason?.toLowerCase().includes('urgent')
  );

  const todayRevenue = completedToday.reduce((sum: number, apt: any) => 
    sum + (apt.cost ? parseFloat(apt.cost.toString()) : 0), 0
  );

  if (clinicLoading || appointmentsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="bg-gradient-to-r from-secondary to-primary p-6 text-primary-foreground rounded-2xl mb-8">
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-secondary to-primary p-6 text-primary-foreground rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="clinic-dashboard-title">
                {clinic?.name || "Clinic Dashboard"}
              </h1>
              <p className="opacity-90" data-testid="clinic-dashboard-subtitle">
                Today: {todayAppointments.length} appointments • {upcomingAppointments.length} pending • {completedToday.length} completed
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button variant="secondary" data-testid="add-appointment-cta">
                <Plus className="mr-2 h-4 w-4" />
                Add Appointment
              </Button>
              <Button variant="secondary" data-testid="view-analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5" data-testid="stat-appointments">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-primary">{todayAppointments.length}</div>
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">Today's Appointments</div>
            <div className="text-xs text-secondary mt-1">
              +{Math.round(Math.random() * 20)}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5" data-testid="stat-patients">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-secondary">{pets.length}</div>
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div className="text-sm text-muted-foreground">Active Patients</div>
            <div className="text-xs text-secondary mt-1">
              +{Math.round(Math.random() * 10)} new this week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5" data-testid="stat-revenue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-accent">
                ${todayRevenue.toLocaleString()}
              </div>
              <DollarSign className="h-6 w-6 text-accent" />
            </div>
            <div className="text-sm text-muted-foreground">Revenue Today</div>
            <div className="text-xs text-secondary mt-1">
              +{Math.round(Math.random() * 15)}% from avg
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5" data-testid="stat-urgent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-destructive">{urgentCases.length}</div>
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="text-sm text-muted-foreground">Urgent Cases</div>
            <div className="text-xs text-muted-foreground mt-1">
              {urgentCases.length > 0 ? "Requires attention" : "All clear"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card data-testid="schedule-section">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Today's Schedule</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search patient..."
                    className="w-48"
                    data-testid="search-patients"
                  />
                  <Button size="icon" variant="outline" data-testid="search-button">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                  todayAppointments.map((appointment: Appointment) => {
                    const pet = pets.find((p: Pet) => p.id === appointment.petId);
                    
                    return (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        pet={pet}
                        userType="clinic"
                        onStatusChange={(id, status) => updateAppointmentMutation.mutate({ id, status })}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-8" data-testid="no-appointments-today">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No appointments scheduled for today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Stats */}
        <div>
          <Card data-testid="quick-actions-section">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90" data-testid="add-patient">
                <Users className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Add New Patient</div>
                  <div className="text-sm opacity-90">Register new pet</div>
                </div>
              </Button>

              <Button className="w-full justify-start bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="emergency-booking">
                <AlertTriangle className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Emergency Booking</div>
                  <div className="text-sm opacity-90">Urgent appointment</div>
                </div>
              </Button>

              <Button className="w-full justify-start bg-accent text-accent-foreground hover:bg-accent/90" data-testid="manage-inventory">
                <Pill className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Manage Inventory</div>
                  <div className="text-sm opacity-90">Medicine & supplies</div>
                </div>
              </Button>

              <Button className="w-full justify-start bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="vaccination-schedule">
                <Syringe className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Vaccination Schedule</div>
                  <div className="text-sm opacity-90">Manage vaccines</div>
                </div>
              </Button>

              {/* Weekly Stats */}
              <div className="bg-muted/30 rounded-xl p-4 mt-6">
                <h5 className="font-medium mb-3">Weekly Overview</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Appointments</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-secondary rounded-full h-2" style={{ width: '92%' }}></div>
                      </div>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Satisfaction</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-accent rounded-full h-2" style={{ width: '98%' }}></div>
                      </div>
                      <span className="text-sm font-medium">98%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
