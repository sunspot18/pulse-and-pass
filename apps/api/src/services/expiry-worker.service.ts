import { BookingService } from './booking.service.js';

let intervalId: NodeJS.Timeout | null = null;

export class ExpiryWorker {
  static start(intervalMs = 15000) {
    if (intervalId) return;

    intervalId = setInterval(async () => {
      try {
        const sweptCount = await BookingService.sweepExpiredHolds();
        if (sweptCount > 0) {
          console.log(`⏱️  Hold Expiry Worker: Swept ${sweptCount} expired reservations back to inventory.`);
        }
      } catch (err) {
        console.error('Error in Hold Expiry Worker:', err);
      }
    }, intervalMs);

    // Unref so worker doesn't prevent graceful server exit
    intervalId.unref();
    console.log('⏱️  Reservation Hold Expiry Worker initialized (15s sweep interval)');
  }

  static stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
}
