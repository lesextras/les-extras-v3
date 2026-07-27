export type OrderEventType =
  | 'MESSAGE_NEW'
  | 'STATUS_CHANGE'
  | 'QUOTE_SENT'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'NOTIFICATION';

export interface OrderEvent {
  type: OrderEventType;
  bookingId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
