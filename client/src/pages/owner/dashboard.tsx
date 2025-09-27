import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import PetCard from "@/components/pet-card";
import AppointmentCard from "@/components/appointment-card";
import { Pet, Appointment, Clinic } from "@shared/schema";
import { Calendar, PawPrint, Clock, Plus, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['/api/pets'],
    queryFn: async () => {
      const response = await fetch('/api/pets', {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to fetch pets');
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

  const { data: clinics = [] } = useQuery({
    queryKey: ['/api/clinics'],
    queryFn: async () => {
      const response = await fetch('/api/clinics');
      if (!response.ok) throw new Error('Failed to fetch clinics');
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

  const upcomingAppointments = appointments.filter((apt: Appointment) => 
    ['pending', 'confirmed', 'in-progress'].includes(apt.status) &&
    new Date(apt.appointmentDate) > new Date()
  );

  const completedAppointments = appointments.filter((apt: Appointment) => 
    apt.status === 'completed'
  );

  if (petsLoading || appointmentsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64" />
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-title">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="opacity-90" data-testid="dashboard-subtitle">
                Managing {pets.length} pet{pets.length !== 1 ? 's' : ''} • {upcomingAppointments.length} upcoming appointment{upcomingAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/booking">
                <Button variant="secondary" data-testid="book-appointment-cta">
                  <Plus className="mr-2 h-4 w-4" />
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card data-testid="stat-pets">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Pets</p>
                <p className="text-2xl font-bold text-primary">{pets.length}</p>
              </div>
              <PawPrint className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-upcoming">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-secondary">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-completed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-accent">{completedAppointments.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-overdue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">0</p>
              </div>
              <Clock className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2">
          <Card data-testid="upcoming-appointments-section">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Appointments</CardTitle>
                <Link href="/booking">
                  <Button size="sm" data-testid="schedule-new-appointment">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule New
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment: Appointment) => {
                    const pet = pets.find((p: Pet) => p.id === appointment.petId);
                    const clinic = clinics.find((c: Clinic) => c.id === appointment.clinicId);
                    
                    return (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        pet={pet}
                        clinic={clinic}
                        userType="owner"
                        onStatusChange={(id, status) => updateAppointmentMutation.mutate({ id, status })}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-8" data-testid="no-appointments">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No upcoming appointments</p>
                    <Link href="/booking">
                      <Button className="mt-4" data-testid="book-first-appointment">
                        Book Your First Appointment
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pet Profiles */}
        <div>
          <Card data-testid="pets-section">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Pets</CardTitle>
                <Link href="/pets">
                  <Button size="sm" variant="outline" data-testid="manage-pets">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pets.length > 0 ? (
                  pets.slice(0, 3).map((pet: Pet) => (
                    <PetCard key={pet.id} pet={pet} showActions={false} />
                  ))
                ) : (
                  <div className="text-center py-8" data-testid="no-pets">
                    <PawPrint className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pets added yet</p>
                    <Link href="/pets">
                      <Button className="mt-4" data-testid="add-first-pet">
                        Add Your First Pet
                      </Button>
                    </Link>
                  </div>
                )}
                {pets.length > 3 && (
                  <Link href="/pets">
                    <Button variant="ghost" className="w-full" data-testid="view-all-pets">
                      View all {pets.length} pets
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
