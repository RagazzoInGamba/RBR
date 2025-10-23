/**
 * Red Bull Racing - New Booking
 * End User interface for creating new meal bookings
 * Enhanced with multi-step wizard for better UX
 */

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/ui/PageHeader';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function NewBookingPage() {
  return (
    <div className="space-y-6 animate-racing-slide-up max-w-6xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/booking' },
          { label: 'Nuova Prenotazione' },
        ]}
      />

      <PageHeader
        title="Prenota il Tuo Pasto"
        subtitle="Segui i passaggi per completare la tua prenotazione"
      />

      {/* Enhanced Multi-Step Wizard */}
      <BookingWizard />
    </div>
  );
}








