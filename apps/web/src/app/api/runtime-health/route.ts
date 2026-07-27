import { getApiBaseUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

function getSafeApiDescriptor(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    return {
      host: url.host,
      pathname: url.pathname || "/",
    };
  } catch {
    return {
      host: "invalid-api-base-url",
      pathname: "",
    };
  }
}

export async function GET() {
  const apiBaseUrl = getApiBaseUrl();
  const startedAt = Date.now();
  const descriptor = getSafeApiDescriptor(apiBaseUrl);

  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    return Response.json(
      {
        ok: response.ok,
        api: descriptor,
        status: response.status,
        durationMs: Date.now() - startedAt,
      },
      { status: response.ok ? 200 : 503 },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        api: descriptor,
        status: null,
        durationMs: Date.now() - startedAt,
        error: "API health check failed",
      },
      { status: 503 },
    );
  }
}
