import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  availableSlots?: string[];
  selectedSlot?: string;
  onSlotSelect: (slot: string) => void;
}

export default function Calendar({
  selectedDate,
  onDateSelect,
  availableSlots = [],
  selectedSlot,
  onSlotSelect,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const days = getDaysInMonth(currentMonth);
  const timeSlots = [
    "9:00 AM", "10:30 AM", "11:15 AM", "2:00 PM", "3:30 PM", "4:45 PM"
  ];

  return (
    <div className="bg-muted/30 rounded-xl p-6" data-testid="calendar-container">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth('prev')}
          data-testid="calendar-prev"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold" data-testid="calendar-month">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth('next')}
          data-testid="calendar-next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        
        {days.map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-full calendar-day text-sm transition-all",
                  {
                    "bg-primary text-primary-foreground font-medium": isSelected(date),
                    "border border-primary": isToday(date) && !isSelected(date),
                    "text-muted-foreground cursor-not-allowed": isPast(date),
                  }
                )}
                onClick={() => !isPast(date) && onDateSelect(date)}
                disabled={isPast(date)}
                data-testid={`calendar-day-${date.getDate()}`}
              >
                {date.getDate()}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <div className="text-sm font-medium mb-3" data-testid="time-slots-title">
            Available Times for {selectedDate.toLocaleDateString()}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {timeSlots.map(slot => (
              <Button
                key={slot}
                variant={selectedSlot === slot ? "default" : "outline"}
                size="sm"
                onClick={() => onSlotSelect(slot)}
                data-testid={`time-slot-${slot.replace(/[^a-zA-Z0-9]/g, '-')}`}
                className="text-sm"
              >
                {slot}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
