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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PetCard from "@/components/pet-card";
import { Pet, User, MedicalRecord, Vaccination, insertMedicalRecordSchema, insertVaccinationSchema } from "@shared/schema";
import { Search, Filter, FileText, Syringe, Calendar, Users, PawPrint, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function ClinicPatients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isVaccineDialogOpen, setIsVaccineDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recordForm = useForm({
    resolver: zodResolver(insertMedicalRecordSchema),
    defaultValues: {
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

  const { data: pets = [], isLoading: petsLoading } = useQuery({
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

  const { data: clinic } = useQuery({
    queryKey: ['/api/clinics/my'],
    queryFn: async () => {
      const response = await fetch('/api/clinics/my', {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to fetch clinic');
      return response.json();
    },
  });

  const { data: petMedicalRecords = [] } = useQuery({
    queryKey: ['/api/pets', selectedPet?.id, 'medical-records'],
    queryFn: async () => {
      if (!selectedPet) return [];
      const response = await fetch(`/api/pets/${selectedPet.id}/medical-records`, {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to fetch medical records');
      return response.json();
    },
    enabled: !!selectedPet,
  });

  const { data: petVaccinations = [] } = useQuery({
    queryKey: ['/api/pets', selectedPet?.id, 'vaccinations'],
    queryFn: async () => {
      if (!selectedPet) return [];
      const response = await fetch(`/api/pets/${selectedPet.id}/vaccinations`, {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to fetch vaccinations');
      return response.json();
    },
    enabled: !!selectedPet,
  });

  const addMedicalRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/medical-records", {
        ...data,
        petId: selectedPet?.id,
        clinicId: clinic?.id,
        recordDate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets', selectedPet?.id, 'medical-records'] });
      toast({
        title: "Medical record added",
        description: "The medical record has been added successfully.",
      });
      setIsRecordDialogOpen(false);
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
        petId: selectedPet?.id,
        clinicId: clinic?.id,
        dateGiven: new Date(data.dateGiven).toISOString(),
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate).toISOString() : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets', selectedPet?.id, 'vaccinations'] });
      toast({
        title: "Vaccination record added",
        description: "The vaccination record has been added successfully.",
      });
      setIsVaccineDialogOpen(false);
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

  const filteredPets = pets.filter((pet: Pet) => {
    const owner = users.find((u: User) => u.id === pet.ownerId);
    
    const matchesSearch = !searchQuery || 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecies = speciesFilter === "all" || pet.species === speciesFilter;
    
    return matchesSearch && matchesSpecies;
  });

  const speciesOptions = Array.from(new Set(pets.map((pet: Pet) => pet.species))) as string[];

  const getAge = (birthDate: Date | string | null) => {
    if (!birthDate) return "Unknown age";
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInYears = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return `${ageInYears} year${ageInYears !== 1 ? 's' : ''} old`;
  };

  if (petsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
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
          <h1 className="text-3xl font-bold tracking-tight" data-testid="patients-title">
            Patient Management
          </h1>
          <p className="text-muted-foreground" data-testid="patients-subtitle">
            View and manage all registered pets and their health records
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Total Patients: {pets.length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by pet name, owner, or breed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-patients"
          />
        </div>
        
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-species">
            <SelectValue placeholder="Filter by species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            {speciesOptions.map((species) => (
              <SelectItem key={species} value={species}>
                {species.charAt(0).toUpperCase() + species.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card data-testid="stat-total-patients">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{filteredPets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-dogs">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PawPrint className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dogs</p>
                <p className="text-2xl font-bold">
                  {filteredPets.filter((pet: Pet) => pet.species === 'dog').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-cats">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PawPrint className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cats</p>
                <p className="text-2xl font-bold">
                  {filteredPets.filter((pet: Pet) => pet.species === 'cat').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-other">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PawPrint className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Other</p>
                <p className="text-2xl font-bold">
                  {filteredPets.filter((pet: Pet) => !['dog', 'cat'].includes(pet.species)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients Grid */}
      {filteredPets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="patients-grid">
          {filteredPets.map((pet: Pet) => {
            const owner = users.find((u: User) => u.id === pet.ownerId);
            
            return (
              <Card key={pet.id} className="hover:shadow-lg transition-all cursor-pointer" data-testid={`patient-card-${pet.id}`}>
                <CardContent className="p-4" onClick={() => setSelectedPet(pet)}>
                  <div className="flex items-center space-x-3 mb-3">
                    {pet.photoUrl ? (
                      <img
                        src={pet.photoUrl}
                        alt={pet.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
                        {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{pet.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pet.breed} • {getAge(pet.birthDate)}
                      </div>
                      {owner && (
                        <div className="text-xs text-muted-foreground">
                          Owner: {owner.firstName} {owner.lastName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Species</span>
                      <Badge variant="secondary">
                        {pet.species}
                      </Badge>
                    </div>
                    {pet.weight && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Weight</span>
                        <span className="text-sm">{pet.weight} kg</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                    <Button size="sm" className="flex-1">
                      View Records
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16" data-testid="no-patients">
          <PawPrint className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">No patients found</h3>
          <p className="text-muted-foreground">
            {searchQuery || speciesFilter !== "all" 
              ? "No patients match your search criteria." 
              : "No patients have been registered yet."
            }
          </p>
        </div>
      )}

      {/* Patient Details Modal */}
      <Dialog open={!!selectedPet} onOpenChange={() => setSelectedPet(null)}>
        <DialogContent className="sm:max-w-[800px]" data-testid="patient-details-modal">
          {selectedPet && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  {selectedPet.photoUrl ? (
                    <img
                      src={selectedPet.photoUrl}
                      alt={selectedPet.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
                      {selectedPet.species === 'dog' ? '🐕' : selectedPet.species === 'cat' ? '🐱' : '🐾'}
                    </div>
                  )}
                  <div>
                    <DialogTitle>{selectedPet.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedPet.breed} • {getAge(selectedPet.birthDate)}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Species</Label>
                    <p className="text-sm">{selectedPet.species}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Gender</Label>
                    <p className="text-sm">{selectedPet.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Weight</Label>
                    <p className="text-sm">{selectedPet.weight ? `${selectedPet.weight} kg` : 'Not recorded'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Color</Label>
                    <p className="text-sm">{selectedPet.color || 'Not specified'}</p>
                  </div>
                </div>

                {selectedPet.medicalNotes && (
                  <div>
                    <Label className="text-sm font-medium">Medical Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedPet.medicalNotes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-medical-record">
                        <FileText className="mr-2 h-4 w-4" />
                        Add Medical Record
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add Medical Record for {selectedPet.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={recordForm.handleSubmit((data) => addMedicalRecordMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                              id="title"
                              placeholder="e.g., Annual Checkup"
                              {...recordForm.register("title")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Record Type</Label>
                            <select
                              className="w-full p-2 border rounded-md"
                              {...recordForm.register("recordType")}
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
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="diagnosis">Diagnosis</Label>
                          <Textarea
                            id="diagnosis"
                            placeholder="Medical findings and diagnosis..."
                            {...recordForm.register("diagnosis")}
                          />
                        </div>

                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsRecordDialogOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={addMedicalRecordMutation.isPending}
                            className="flex-1"
                          >
                            {addMedicalRecordMutation.isPending ? "Adding..." : "Add Record"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isVaccineDialogOpen} onOpenChange={setIsVaccineDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="add-vaccination">
                        <Syringe className="mr-2 h-4 w-4" />
                        Add Vaccination
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add Vaccination for {selectedPet.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={vaccineForm.handleSubmit((data) => addVaccinationMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vaccineName">Vaccine Name *</Label>
                            <Input
                              id="vaccineName"
                              placeholder="e.g., DHPP"
                              {...vaccineForm.register("vaccineName")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dateGiven">Date Given *</Label>
                            <Input
                              id="dateGiven"
                              type="date"
                              {...vaccineForm.register("dateGiven")}
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
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="veterinarian">Veterinarian</Label>
                            <Input
                              id="veterinarian"
                              placeholder="Dr. Smith"
                              {...vaccineForm.register("veterinarian")}
                            />
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsVaccineDialogOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={addVaccinationMutation.isPending}
                            className="flex-1"
                          >
                            {addVaccinationMutation.isPending ? "Adding..." : "Add Vaccination"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
