import { Pet } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

interface PetCardProps {
  pet: Pet;
  showActions?: boolean;
}

export default function PetCard({ pet, showActions = true }: PetCardProps) {
  const getAge = (birthDate: Date | string | null) => {
    if (!birthDate) return "Unknown age";
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInYears = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return `${ageInYears} years old`;
  };

  const getSpeciesEmoji = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'rabbit': return '🐰';
      case 'bird': return '🐦';
      default: return '🐾';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all" data-testid={`pet-card-${pet.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          {pet.photoUrl ? (
            <img
              src={pet.photoUrl}
              alt={pet.name}
              className="w-12 h-12 rounded-full object-cover"
              data-testid={`pet-photo-${pet.id}`}
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
              {getSpeciesEmoji(pet.species)}
            </div>
          )}
          <div>
            <div className="font-semibold" data-testid={`pet-name-${pet.id}`}>
              {pet.name}
            </div>
            <div className="text-sm text-muted-foreground" data-testid={`pet-details-${pet.id}`}>
              {pet.breed} • {getAge(pet.birthDate)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Species</span>
            <Badge variant="secondary" data-testid={`pet-species-${pet.id}`}>
              {pet.species}
            </Badge>
          </div>
          {pet.gender && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gender</span>
              <span className="text-sm capitalize" data-testid={`pet-gender-${pet.id}`}>
                {pet.gender}
              </span>
            </div>
          )}
          {pet.weight && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Weight</span>
              <span className="text-sm" data-testid={`pet-weight-${pet.id}`}>
                {pet.weight} kg
              </span>
            </div>
          )}
          {pet.color && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Color</span>
              <span className="text-sm" data-testid={`pet-color-${pet.id}`}>
                {pet.color}
              </span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2 mt-4">
            <Link href={`/pets/${pet.id}`}>
              <Button size="sm" variant="outline" className="flex-1" data-testid={`view-pet-${pet.id}`}>
                View Profile
              </Button>
            </Link>
            <Link href={`/booking?petId=${pet.id}`}>
              <Button size="sm" className="flex-1" data-testid={`book-appointment-${pet.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                Book
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
