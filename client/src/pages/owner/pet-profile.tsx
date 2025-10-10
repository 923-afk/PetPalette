import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pet, MedicalRecord, Vaccination, insertMedicalRecordSchema, insertVaccinationSchema } from "@shared/schema";
import { ArrowLeft, Edit, Camera, Plus, Calendar, FileText, Syringe, Heart } from "lucide-react";
import { Link } from "wouter";

export default function PetProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isAddRecordDialogOpen, setIsAddRecordDialogOpen] = useState(false);
  const [isAddVaccineDialogOpen, setIsAddVaccineDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recordForm = useForm({
    resolver: zodResolver(insertMedicalRecordSchema),
    defaultValues: {
      petId: id,
      clinicId: "",
      recordType: "checkup",
      title: "",
      description: "",
      diagnosis: "",
      treatment: "",
      notes: "",
    },
  });

  const vaccineForm = useForm({
    resolver: zodResolver(insertVaccinationSchema),
    defaultValues: {
      petId: id,
      clinicId: "",
      vaccineName: "",
      manufacturer: "",
      lotNumber: "",
      dateGiven: "",
      nextDueDate: "",
      veterinarian: "",
      notes: "",
    },
  });

  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['/api/pets', id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/pets/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  const { data: medicalRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['/api/pets', id, 'medical-records'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/pets/${id}/medical-records`);
      return response.json();
    },
    enabled: !!id,
  });

  const { data: vaccinations = [], isLoading: vaccinationsLoading } = useQuery({
    queryKey: ['/api/pets', id, 'vaccinations'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/pets/${id}/vaccinations`);
      return response.json();
    },
    enabled: !!id,
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['/api/clinics'],
    queryFn: async () => {
      const response = await fetch('/api/clinics');
      if (!response.ok) throw new Error('Failed to fetch clinics');
      return response.json();
    },
  });

  const addMedicalRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/medical-records", {
        ...data,
        recordDate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets', id, 'medical-records'] });
      toast({
        title: "Medical record added",
        description: "The medical record has been added successfully.",
      });
      setIsAddRecordDialogOpen(false);
      recordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add record",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const addVaccinationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/vaccinations", {
        ...data,
        dateGiven: new Date(data.dateGiven).toISOString(),
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate).toISOString() : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets', id, 'vaccinations'] });
      toast({
        title: "Vaccination record added",
        description: "The vaccination record has been added successfully.",
      });
      setIsAddVaccineDialogOpen(false);
      vaccineForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add vaccination",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const getAge = (birthDate: Date | string | null) => {
    if (!birthDate) return "Unknown age";
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInYears = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (ageInYears >= 1) {
      return `${ageInYears} year${ageInYears > 1 ? 's' : ''} old`;
    } else {
      return `${ageInMonths} month${ageInMonths > 1 ? 's' : ''} old`;
    }
  };

  if (petLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-8">
            <Skeleton className="w-32 h-32 rounded-full mb-6 md:mb-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Pet not found.</p>
          <Link href="/pets">
            <Button>Back to Pets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/pets">
          <Button variant="ghost" size="icon" data-testid="back-to-pets">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="pet-profile-title">
            {pet.name}'s Profile
          </h1>
          <p className="text-muted-foreground">Complete health management</p>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground rounded-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-8">
          <div className="relative mb-6 md:mb-0">
            {pet.photoUrl ? (
              <img
                src={pet.photoUrl}
                alt={pet.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
                data-testid="pet-photo"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white/20 flex items-center justify-center text-6xl">
                {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}
              </div>
            )}
            <Button
              size="icon"
              className="absolute bottom-0 right-0 w-10 h-10 bg-white text-gray-700 rounded-full shadow-lg hover:shadow-xl"
              data-testid="change-photo-button"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2" data-testid="pet-name">
              {pet.name}
            </h2>
            <div className="space-y-1 text-lg opacity-90">
              <p data-testid="pet-details">
                {pet.breed} • {pet.gender} • {getAge(pet.birthDate)}
              </p>
              <p>Owner: {user?.firstName} {user?.lastName}</p>
              {pet.microchipId && (
                <p className="text-sm">Microchip: {pet.microchipId}</p>
              )}
            </div>
          </div>

          <div className="mt-6 md:mt-0">
            <Button
              variant="secondary"
              data-testid="edit-pet-button"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Health Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-secondary/10">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">💚</div>
            <div className="font-semibold text-secondary">Excellent</div>
            <div className="text-sm text-muted-foreground">Overall Health</div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-semibold text-primary">Up to Date</div>
            <div className="text-sm text-muted-foreground">Vaccinations</div>
          </CardContent>
        </Card>

        <Card className="bg-accent/10">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="font-semibold text-accent">None Due</div>
            <div className="text-sm text-muted-foreground">Next Checkup</div>
          </CardContent>
        </Card>

        <Card className="bg-muted">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🏥</div>
            <div className="font-semibold">{medicalRecords.length}</div>
            <div className="text-sm text-muted-foreground">Total Visits</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="medical" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="medical" data-testid="tab-medical">Medical History</TabsTrigger>
          <TabsTrigger value="vaccinations" data-testid="tab-vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="medical" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Medical History</h3>
            <Dialog open={isAddRecordDialogOpen} onOpenChange={setIsAddRecordDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-medical-record">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Record
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Medical Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={recordForm.handleSubmit((data) => addMedicalRecordMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicId">Clinic *</Label>
                    <select
                      id="clinicId"
                      className="w-full p-2 border rounded-md"
                      {...recordForm.register("clinicId")}
                      data-testid="select-record-clinic"
                      required
                    >
                      <option value="" disabled>Select clinic</option>
                      {clinics.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Annual Checkup"
                        {...recordForm.register("title")}
                        data-testid="input-record-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Record Type</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        {...recordForm.register("recordType")}
                        data-testid="select-record-type"
                      >
                        <option value="checkup">Checkup</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="surgery">Surgery</option>
                        <option value="emergency">Emergency</option>
                        <option value="dental">Dental</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the visit or procedure..."
                      {...recordForm.register("description")}
                      data-testid="input-record-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      placeholder="Medical findings and diagnosis..."
                      {...recordForm.register("diagnosis")}
                      data-testid="input-record-diagnosis"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="treatment">Treatment</Label>
                    <Textarea
                      id="treatment"
                      placeholder="Treatment provided..."
                      {...recordForm.register("treatment")}
                      data-testid="input-record-treatment"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddRecordDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addMedicalRecordMutation.isPending}
                      className="flex-1"
                      data-testid="submit-medical-record"
                    >
                      {addMedicalRecordMutation.isPending ? "Adding..." : "Add Record"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {medicalRecords.length > 0 ? (
              medicalRecords.map((record: MedicalRecord) => (
                <Card key={record.id} className="hover:shadow-sm transition-shadow" data-testid={`medical-record-${record.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{record.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.recordDate ? new Date(record.recordDate).toLocaleDateString() : 'No date'} • {record.recordType}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {record.recordType}
                      </Badge>
                    </div>

                    {record.description && (
                      <div className="ml-13 space-y-2">
                        <p className="text-sm">
                          <strong>Description:</strong> {record.description}
                        </p>
                      </div>
                    )}

                    {record.diagnosis && (
                      <div className="ml-13 space-y-2">
                        <p className="text-sm">
                          <strong>Diagnosis:</strong> {record.diagnosis}
                        </p>
                      </div>
                    )}

                    {record.treatment && (
                      <div className="ml-13 space-y-2">
                        <p className="text-sm">
                          <strong>Treatment:</strong> {record.treatment}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8" data-testid="no-medical-records">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No medical records yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vaccinations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Vaccination History</h3>
            <Dialog open={isAddVaccineDialogOpen} onOpenChange={setIsAddVaccineDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-vaccination">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vaccination
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Vaccination Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={vaccineForm.handleSubmit((data) => addVaccinationMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vaccineName">Vaccine Name *</Label>
                      <Input
                        id="vaccineName"
                        placeholder="e.g., DHPP"
                        {...vaccineForm.register("vaccineName")}
                        data-testid="input-vaccine-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateGiven">Date Given *</Label>
                      <Input
                        id="dateGiven"
                        type="date"
                        {...vaccineForm.register("dateGiven")}
                        data-testid="input-date-given"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        placeholder="e.g., Merck"
                        {...vaccineForm.register("manufacturer")}
                        data-testid="input-manufacturer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lotNumber">Lot Number</Label>
                      <Input
                        id="lotNumber"
                        placeholder="Vaccine lot number"
                        {...vaccineForm.register("lotNumber")}
                        data-testid="input-lot-number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="veterinarian">Veterinarian</Label>
                      <Input
                        id="veterinarian"
                        placeholder="Dr. Smith"
                        {...vaccineForm.register("veterinarian")}
                        data-testid="input-veterinarian"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nextDueDate">Next Due Date</Label>
                      <Input
                        id="nextDueDate"
                        type="date"
                        {...vaccineForm.register("nextDueDate")}
                        data-testid="input-next-due-date"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddVaccineDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addVaccinationMutation.isPending}
                      className="flex-1"
                      data-testid="submit-vaccination"
                    >
                      {addVaccinationMutation.isPending ? "Adding..." : "Add Vaccination"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {vaccinations.length > 0 ? (
              vaccinations.map((vaccination: Vaccination) => (
                <Card key={vaccination.id} className="hover:shadow-sm transition-shadow" data-testid={`vaccination-${vaccination.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                          <Syringe className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <div className="font-semibold">{vaccination.vaccineName}</div>
                          <div className="text-sm text-muted-foreground">
                            Given: {new Date(vaccination.dateGiven).toLocaleDateString()}
                            {vaccination.veterinarian && ` • Dr. ${vaccination.veterinarian}`}
                          </div>
                        </div>
                      </div>
                      {vaccination.nextDueDate && (
                        <Badge variant="outline">
                          Next: {new Date(vaccination.nextDueDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    <div className="ml-13 space-y-1 text-sm text-muted-foreground">
                      {vaccination.manufacturer && (
                        <p><strong>Manufacturer:</strong> {vaccination.manufacturer}</p>
                      )}
                      {vaccination.lotNumber && (
                        <p><strong>Lot Number:</strong> {vaccination.lotNumber}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8" data-testid="no-vaccinations">
                <Syringe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No vaccination records yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="text-center py-8" data-testid="no-documents">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Document management coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
