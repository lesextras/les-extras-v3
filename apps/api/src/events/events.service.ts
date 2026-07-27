import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, filter } from 'rxjs';
import { OrderEvent } from './events.types';

@Injectable()
export class EventsService implements OnModuleDestroy {
  private readonly subjects = new Map<string, Subject<OrderEvent>>();

  /**
   * Get or create a Subject for a given userId.
   */
  private getSubject(userId: string): Subject<OrderEvent> {
    let subject = this.subjects.get(userId);
    if (!subject) {
      subject = new Subject<OrderEvent>();
      this.subjects.set(userId, subject);
    }
    return subject;
  }

  /**
   * Emit an event to a specific user.
   */
  emit(userId: string, event: OrderEvent): void {
    this.getSubject(userId).next(event);
  }

  /**
   * Emit the same event to multiple users at once.
   */
  emitToMany(userIds: string[], event: OrderEvent): void {
    for (const userId of userIds) {
      this.emit(userId, event);
    }
  }

  /**
   * Subscribe to events for a given user.
   * Optionally filter by bookingId.
   */
  subscribe(userId: string, bookingId?: string): Observable<OrderEvent> {
    const source$ = this.getSubject(userId).asObservable();
    if (bookingId) {
      return source$.pipe(filter((e) => e.bookingId === bookingId));
    }
    return source$;
  }

  /**
   * Clean up a user's subject when they disconnect.
   */
  removeUser(userId: string): void {
    const subject = this.subjects.get(userId);
    if (subject) {
      subject.complete();
      this.subjects.delete(userId);
    }
  }

  onModuleDestroy() {
    for (const [, subject] of this.subjects) {
      subject.complete();
    }
    this.subjects.clear();
  }
}
