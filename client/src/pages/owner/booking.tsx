import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Calendar from "@/components/calendar";
import { Pet, Clinic, insertAppointmentSchema } from "@shared/schema";
import { Calendar as CalendarIcon, MapPin, Clock, Check } from "lucide-react";

const bookingSchema = insertAppointmentSchema.extend({
  reason: z.string().optional(),
});

type BookingData = z.infer<typeof bookingSchema>;

export default function OwnerBooking() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState<string>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookingData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      ownerId: user?.id,
      serviceType: "General Checkup",
      status: "pending",
      reason: "",
    },
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['/api/pets'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/pets");
      return response.json();
    },
  });

  const { data: clinics = [], isLoading: clinicsLoading } = useQuery({
    queryKey: ['/api/clinics'],
    queryFn: async () => {
      const response = await fetch('/api/clinics');
      if (!response.ok) throw new Error('Failed to fetch clinics');
      return response.json();
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingData) => {
      const appointmentDate = new Date(selectedDate!);
      const [time, period] = selectedSlot!.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      appointmentDate.setHours(hour, parseInt(minutes), 0);

      const response = await apiRequest("POST", "/api/appointments", {
        ...data,
        appointmentDate: appointmentDate.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Appointment booked!",
        description: "Your appointment has been scheduled successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to book appointment.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingData) => {
    if (!selectedDate || !selectedSlot) {
      toast({
        title: "Missing information",
        description: "Please select a date and time slot.",
        variant: "destructive",
      });
      return;
    }
    createAppointmentMutation.mutate(data);
  };

  const serviceTypes = [
    { value: "General Checkup", icon: "🩺", description: "Routine health examination" },
    { value: "Vaccination", icon: "💉", description: "Preventive immunizations" },
    { value: "Dental Care", icon: "🦷", description: "Oral health and cleaning" },
    { value: "Surgery", icon: "🏥", description: "Surgical procedures" },
    { value: "Emergency", icon: "🚨", description: "Urgent medical care" },
  ];

  if (petsLoading || clinicsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="booking-title">
          Book an Appointment
        </h1>
        <p className="text-lg text-muted-foreground">
          Schedule quality care for your pet in just a few simple steps.
        </p>
      </div>

      <Card className="shadow-xl">
        {/* Step Indicator */}
        <div className="bg-muted/30 px-8 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted border-2 border-border'} rounded-full flex items-center justify-center text-sm font-medium`}>
                1
              </div>
              <span className={step >= 1 ? 'font-medium text-primary' : 'text-muted-foreground'}>
                Select Service
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted border-2 border-border'} rounded-full flex items-center justify-center text-sm font-medium`}>
                2
              </div>
              <span className={step >= 2 ? 'font-medium text-primary' : 'text-muted-foreground'}>
                Choose Date & Time
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted border-2 border-border'} rounded-full flex items-center justify-center text-sm font-medium`}>
                3
              </div>
              <span className={step >= 3 ? 'font-medium text-primary' : 'text-muted-foreground'}>
                Confirm Booking
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-4 block">Select Your Pet</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pets.length > 0 ? (
                      pets.map((pet: Pet) => (
                        <div
                          key={pet.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            form.watch("petId") === pet.id ? "border-primary bg-primary/5" : "hover:border-primary"
                          }`}
                          onClick={() => form.setValue("petId", pet.id)}
                          data-testid={`select-pet-${pet.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            {pet.photoUrl ? (
                              <img src={pet.photoUrl} alt={pet.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
                                {pet.species === 'dog' ? '🐕' : '🐱'}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{pet.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {pet.breed} • {pet.species}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <p className="text-muted-foreground mb-4">No pets found. Please add a pet first.</p>
                        <Button onClick={() => setLocation("/pets")} data-testid="add-pet-first">
                          Add Your First Pet
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-4 block">Type of Service</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {serviceTypes.map((service) => (
                      <div
                        key={service.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          form.watch("serviceType") === service.value ? "border-primary bg-primary/5" : "hover:border-primary"
                        }`}
                        onClick={() => form.setValue("serviceType", service.value)}
                        data-testid={`select-service-${service.value.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">{service.icon}</div>
                          <div className="font-medium text-sm">{service.value}</div>
                          <div className="text-xs text-muted-foreground mt-1">{service.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-4 block">Select Clinic</Label>
                  <div className="space-y-3">
                    {clinics.map((clinic: Clinic) => (
                      <div
                        key={clinic.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          form.watch("clinicId") === clinic.id ? "border-primary bg-primary/5" : "hover:border-primary"
                        }`}
                        onClick={() => form.setValue("clinicId", clinic.id)}
                        data-testid={`select-clinic-${clinic.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{clinic.name}</div>
                            <div className="text-sm text-muted-foreground">{clinic.address}</div>
                            <div className="text-sm text-muted-foreground">{clinic.phone}</div>
                            {clinic.services && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {clinic.services.slice(0, 3).map((service) => (
                                  <Badge key={service} variant="secondary" className="text-xs">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full"
                  disabled={!form.watch("petId") || !form.watch("clinicId")}
                  data-testid="next-to-datetime"
                >
                  Continue to Date & Time
                </Button>
              </div>
            )}

            {/* Step 2: Date & Time Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    data-testid="back-to-service"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1"
                    disabled={!selectedDate || !selectedSlot}
                    data-testid="next-to-confirm"
                  >
                    Continue to Confirmation
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4" data-testid="booking-summary-title">
                    Booking Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pet:</span>
                      <span className="font-medium">
                        {pets.find((p: Pet) => p.id === form.watch("petId"))?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-medium">{form.watch("serviceType")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Clinic:</span>
                      <span className="font-medium">
                        {clinics.find((c: Clinic) => c.id === form.watch("clinicId"))?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date & Time:</span>
                      <span className="font-medium">
                        {selectedDate?.toLocaleDateString()} at {selectedSlot}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Reason for Visit (Optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Describe any specific concerns or symptoms..."
                      {...form.register("reason")}
                      data-testid="input-reason"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                    data-testid="back-to-datetime"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createAppointmentMutation.isPending}
                    data-testid="submit-booking"
                  >
                    {createAppointmentMutation.isPending ? (
                      "Booking..."
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
