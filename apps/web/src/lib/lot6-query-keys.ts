export const reviewsQueryKeys = {
  all: ["reviews"] as const,
  byTarget: (targetId: string) => ["reviews", "target", targetId] as const,
  byBooking: (bookingId: string) => ["reviews", "booking", bookingId] as const,
  average: (targetId: string) => ["reviews", "average", targetId] as const,
};

export const financeQueryKeys = {
  all: ["finance"] as const,
  invoices: () => ["finance", "invoices"] as const,
  paymentStatus: () => ["finance", "payment-status"] as const,
};

export const notificationsQueryKeys = {
  all: ["notifications"] as const,
  list: () => ["notifications", "list"] as const,
};

export const lot6InvalidationPaths = {
  bookings: "/bookings",
  orders: "/orders",
  dashboard: "/dashboard",
  finance: "/finance",
  inbox: "/dashboard/inbox",
} as const;
