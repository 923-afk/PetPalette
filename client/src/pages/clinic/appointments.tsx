import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppointmentCard from "@/components/appointment-card";
import { Appointment, Pet, User } from "@shared/schema";
import { Calendar, Search, Filter, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function ClinicAppointments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) return [];
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

  const filteredAppointments = appointments.filter((apt: Appointment) => {
    const pet = pets.find((p: Pet) => p.id === apt.petId);
    const owner = users.find((u: User) => u.id === apt.ownerId);
    
    const matchesSearch = !searchQuery || 
      pet?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.serviceType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesService = serviceFilter === "all" || apt.serviceType === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const todayAppointments = filteredAppointments.filter((apt: Appointment) => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate.toDateString() === today.toDateString();
  });

  const upcomingAppointments = filteredAppointments.filter((apt: Appointment) => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate > today && ['pending', 'confirmed'].includes(apt.status);
  });

  const pastAppointments = filteredAppointments.filter((apt: Appointment) => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate < today || apt.status === 'completed';
  });

  const serviceTypes = Array.from(new Set(appointments.map((apt: Appointment) => apt.serviceType))) as string[];

  if (appointmentsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="appointments-title">
            Appointments
          </h1>
          <p className="text-muted-foreground" data-testid="appointments-subtitle">
            Manage your clinic's appointment schedule
          </p>
        </div>
        
        <Button data-testid="add-appointment-button">
          <Plus className="mr-2 h-4 w-4" />
          Add Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by pet name, owner, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-appointments"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-service">
            <SelectValue placeholder="Filter by service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {serviceTypes.map((service) => (
              <SelectItem key={service} value={service}>
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card data-testid="stat-today">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-upcoming">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-completed">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {appointments.filter((apt: Appointment) => apt.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Tabs */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" data-testid="tab-today">
            Today ({todayAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todayAppointments.length > 0 ? (
            <div className="space-y-4" data-testid="today-appointments">
              {todayAppointments.map((appointment: Appointment) => {
                const pet = pets.find((p: Pet) => p.id === appointment.petId);
                const owner = users.find((u: User) => u.id === appointment.ownerId);
                
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    userType="clinic"
                    onStatusChange={(id, status) => updateAppointmentMutation.mutate({ id, status })}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8" data-testid="no-today-appointments">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No appointments scheduled for today</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4" data-testid="upcoming-appointments">
              {upcomingAppointments.map((appointment: Appointment) => {
                const pet = pets.find((p: Pet) => p.id === appointment.petId);
                const owner = users.find((u: User) => u.id === appointment.ownerId);
                
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    userType="clinic"
                    onStatusChange={(id, status) => updateAppointmentMutation.mutate({ id, status })}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8" data-testid="no-upcoming-appointments">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No upcoming appointments</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length > 0 ? (
            <div className="space-y-4" data-testid="past-appointments">
              {pastAppointments.map((appointment: Appointment) => {
                const pet = pets.find((p: Pet) => p.id === appointment.petId);
                const owner = users.find((u: User) => u.id === appointment.ownerId);
                
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    userType="clinic"
                    showActions={false}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8" data-testid="no-past-appointments">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No past appointments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
