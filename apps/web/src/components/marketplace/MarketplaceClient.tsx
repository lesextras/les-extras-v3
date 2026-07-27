"use client";

import type { MissionCardProps } from "@/components/cards/MissionCard";
import type { ServiceCardProps } from "@/components/cards/ServiceCard";
import { MarketList } from "./MarketList";

type MarketplaceClientProps = {
  missions: MissionCardProps["mission"][];
  services: ServiceCardProps["service"][];
  mockEstablishmentId?: string;
  mockFreelanceId?: string;
};

export function MarketplaceClient({ missions, services }: MarketplaceClientProps) {
  return <MarketList missions={missions} services={services} />;
}
