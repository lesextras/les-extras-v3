import { getApiBaseUrl } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: { documentId: string } },
) {
  const session = await getSession();

  if (!session) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { documentId } = context.params;
  const response = await fetch(`${getApiBaseUrl()}/users/me/documents/${documentId}/file`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return new Response("Document introuvable", { status: response.status });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition":
        response.headers.get("content-disposition") ?? 'inline; filename="document"',
      "Cache-Control": "private, no-store",
    },
  });
}
