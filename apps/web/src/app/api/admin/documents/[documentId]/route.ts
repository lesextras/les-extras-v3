import { getAdminSessionToken } from "@/app/actions/_shared/admin-session";
import { getApiBaseUrl } from "@/lib/api";

export async function GET(
  _request: Request,
  context: { params: { documentId: string } },
) {
  let token: string;

  try {
    token = await getAdminSessionToken();
  } catch {
    return new Response("Session admin requise", { status: 401 });
  }

  const { documentId } = context.params;
  const response = await fetch(`${getApiBaseUrl()}/admin/users/documents/${documentId}/file`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
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
