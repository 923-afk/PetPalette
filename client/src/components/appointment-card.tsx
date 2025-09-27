import { Appointment, Pet, Clinic } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppointmentCardProps {
  appointment: Appointment;
  pet?: Pet;
  clinic?: Clinic;
  showActions?: boolean;
  userType?: 'owner' | 'clinic';
  onStatusChange?: (appointmentId: string, status: string) => void;
}

export default function AppointmentCard({
  appointment,
  pet,
  clinic,
  showActions = true,
  userType = 'owner',
  onStatusChange,
}: AppointmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-secondary/10 text-secondary';
      case 'pending': return 'bg-accent/10 text-accent';
      case 'in-progress': return 'bg-primary/10 text-primary';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'checkup':
      case 'general checkup': return '🩺';
      case 'vaccination': return '💉';
      case 'dental': return '🦷';
      case 'surgery': return '🏥';
      default: return '📋';
    }
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDateTime(appointment.appointmentDate);

  return (
    <Card className="appointment-card hover:shadow-lg" data-testid={`appointment-card-${appointment.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {userType === 'clinic' && (
              <div className="text-center">
                <div className="text-sm font-medium" data-testid={`appointment-time-${appointment.id}`}>
                  {time.split(':')[0]}:{time.split(':')[1].split(' ')[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {time.split(' ')[1]}
                </div>
              </div>
            )}
            
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
              {getServiceIcon(appointment.serviceType)}
            </div>
            
            <div>
              <div className="font-semibold" data-testid={`appointment-title-${appointment.id}`}>
                {appointment.serviceType} - {pet?.name || 'Pet'}
              </div>
              <div className="text-sm text-muted-foreground" data-testid={`appointment-details-${appointment.id}`}>
                {date} at {time}
              </div>
              {clinic && (
                <div className="text-sm text-muted-foreground">
                  {clinic.name} • Dr. {appointment.doctorName}
                </div>
              )}
              {appointment.reason && (
                <div className="text-sm text-muted-foreground">
                  Reason: {appointment.reason}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge
              className={getStatusColor(appointment.status)}
              data-testid={`appointment-status-${appointment.id}`}
            >
              {appointment.status}
            </Badge>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid={`appointment-menu-${appointment.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userType === 'clinic' && appointment.status === 'pending' && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(appointment.id, 'confirmed')}
                      data-testid={`confirm-appointment-${appointment.id}`}
                    >
                      Confirm
                    </DropdownMenuItem>
                  )}
                  {userType === 'clinic' && appointment.status === 'confirmed' && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(appointment.id, 'in-progress')}
                      data-testid={`start-appointment-${appointment.id}`}
                    >
                      Start
                    </DropdownMenuItem>
                  )}
                  {userType === 'clinic' && appointment.status === 'in-progress' && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(appointment.id, 'completed')}
                      data-testid={`complete-appointment-${appointment.id}`}
                    >
                      Complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(appointment.id, 'cancelled')}
                    data-testid={`cancel-appointment-${appointment.id}`}
                  >
                    Cancel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
