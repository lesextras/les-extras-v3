// Idem pour les sous-pages : /dashboard/gap/poser et /dashboard/gap/<id>
// continuent de fonctionner, en menant à leur nouvelle adresse sur le site.
import { redirect } from "next/navigation";

export default function GapDashboardSousPageRedirect({
  params,
}: {
  params: { reste?: string[] };
}) {
  redirect(`/gap/${(params.reste ?? []).join("/")}`);
}
