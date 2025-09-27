import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PetCard from "@/components/pet-card";
import { Pet, insertPetSchema } from "@shared/schema";
import { Plus, PawPrint, Search } from "lucide-react";

type PetFormData = typeof insertPetSchema._type;

export default function OwnerPets() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PetFormData>({
    resolver: zodResolver(insertPetSchema),
    defaultValues: {
      ownerId: user?.id,
      name: "",
      species: "",
      breed: "",
      gender: "",
      weight: "",
      color: "",
      microchipId: "",
      medicalNotes: "",
    },
  });

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['/api/pets'],
    queryFn: async () => {
      const response = await fetch('/api/pets', {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to fetch pets');
      return response.json();
    },
  });

  const createPetMutation = useMutation({
    mutationFn: async (data: PetFormData) => {
      const petData = {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : null,
      };
      const response = await apiRequest("POST", "/api/pets", petData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets'] });
      toast({
        title: "Pet added successfully!",
        description: "Your pet has been added to your profile.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add pet",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PetFormData) => {
    createPetMutation.mutate(data);
  };

  const filteredPets = pets.filter((pet: Pet) =>
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pet.breed && pet.breed.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-48" />
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
          <h1 className="text-3xl font-bold tracking-tight" data-testid="pets-title">
            My Pets
          </h1>
          <p className="text-muted-foreground" data-testid="pets-subtitle">
            Manage your pets' profiles and health information
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-pet-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]" data-testid="add-pet-dialog">
            <DialogHeader>
              <DialogTitle>Add New Pet</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Pet Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Max"
                    {...form.register("name")}
                    data-testid="input-pet-name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Species *</Label>
                  <Select
                    onValueChange={(value) => form.setValue("species", value)}
                  >
                    <SelectTrigger data-testid="select-species">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.species && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.species.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    placeholder="e.g., Golden Retriever"
                    {...form.register("breed")}
                    data-testid="input-breed"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    onValueChange={(value) => form.setValue("gender", value)}
                  >
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...form.register("birthDate")}
                    data-testid="input-birth-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 25.5"
                    {...form.register("weight")}
                    data-testid="input-weight"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Golden"
                    {...form.register("color")}
                    data-testid="input-color"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="microchipId">Microchip ID</Label>
                  <Input
                    id="microchipId"
                    placeholder="15-digit ID"
                    {...form.register("microchipId")}
                    data-testid="input-microchip"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalNotes">Medical Notes</Label>
                <Textarea
                  id="medicalNotes"
                  placeholder="Any allergies, conditions, or notes..."
                  {...form.register("medicalNotes")}
                  data-testid="input-medical-notes"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                  data-testid="cancel-add-pet"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPetMutation.isPending}
                  className="flex-1"
                  data-testid="submit-add-pet"
                >
                  {createPetMutation.isPending ? "Adding..." : "Add Pet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search pets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-pets"
          />
        </div>
      </div>

      {/* Pets Grid */}
      {filteredPets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="pets-grid">
          {filteredPets.map((pet: Pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-16" data-testid="no-pets-state">
          <PawPrint className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">No pets yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first pet to get started with booking appointments and managing their health.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-first-pet">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Pet
          </Button>
        </div>
      ) : (
        <div className="text-center py-16" data-testid="no-search-results">
          <Search className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">No pets found</h3>
          <p className="text-muted-foreground">
            No pets match your search criteria. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
