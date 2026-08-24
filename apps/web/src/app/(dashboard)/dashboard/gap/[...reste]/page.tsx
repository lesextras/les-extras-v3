// Idem pour les sous-pages : /dashboard/gap/poser et /dashboard/gap/<id>
// continuent de fonctionner, en menant à leur nouvelle adresse sur le site.
import { redirect } from "next/navigation";

export default async function GapDashboardSousPageRedirect({
  params: paramsPromesse,
}: {
  params: Promise<{ reste?: string[] }>;
}) {
  const params = await paramsPromesse;
  redirect(`/gap/${(params.reste ?? []).join("/")}`);
}
