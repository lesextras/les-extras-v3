"use client";

// LE PONT entre la proposition et le contrat de travail.
//
// C'est le geste que le produit vend, et il n'existait pas : on trouvait
// quelqu'un, puis on repartait de zéro dans un autre écran pour l'embaucher.
// Ce bouton reprend ce que l'on sait déjà — la personne, le poste, les dates,
// le taux — et ouvre le brouillon de CDD. Ce qui reste à saisir est
// exactement ce que la plateforme ne peut pas connaître : la convention
// collective de l'établissement, sa caisse de retraite, sa prévoyance.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function EtablirCdd({
  bookingId,
  accountId,
  className,
}: {
  bookingId: string;
  accountId: string;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function etablir() {
    setLoading(true);
    try {
      const res = (await apiRequest(`/contrats/depuis-renfort/${bookingId}`, {
        method: "POST",
        accountId,
      })) as { contrat: { id: string } };
      toast({
        title: "Brouillon de contrat créé",
        description:
          "Complétez la convention collective, la caisse de retraite et la prévoyance : elles ne se devinent pas.",
      });
      router.push(`/dashboard/contrats/${res.contrat.id}`);
    } catch (err) {
      toast({
        title: "Impossible d’établir le contrat",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
      setLoading(false);
    }
  }

  return (
    <Button onClick={etablir} loading={loading} className={className}>
      <FileSignature className="size-4" />
      Établir le CDD
    </Button>
  );
}
