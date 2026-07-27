export const atelierQueryKeys = {
  all: ["ateliers"] as const,
  catalogue: () => ["ateliers", "catalogue"] as const,
  detail: (serviceId: string) => ["ateliers", "detail", serviceId] as const,
};

export const mesAteliersQueryKeys = {
  all: ["mes-ateliers"] as const,
  list: (freelanceId: string) => ["mes-ateliers", "list", freelanceId] as const,
  serviceBookings: (freelanceId: string) => ["mes-ateliers", "service-bookings", freelanceId] as const,
};

export const atelierInvalidationPaths = {
  catalogue: "/marketplace",
  bookings: "/bookings",
  dashboard: "/dashboard",
  mesAteliers: "/dashboard/ateliers",
} as const;
