import { redirect } from "next/navigation";
import { UnauthorizedError, toUserFacingApiError } from "@/lib/api";

export type AdminWidgetResult<T> = { data: T; error: string | null };

function isAdminSessionError(error: unknown): boolean {
  if (error instanceof UnauthorizedError) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("session admin requise") ||
    message.includes("session expirée") ||
    message.includes("unauthorized")
  );
}

export async function fetchAdminSafe<T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<AdminWidgetResult<T>> {
  try {
    return { data: await fn(), error: null };
  } catch (error) {
    if (isAdminSessionError(error)) {
      redirect("/admin/login");
    }

    console.error("[admin-safe-fetch] widget unavailable", {
      label,
      error: error instanceof Error ? error.message : error,
    });

    return {
      data: fallback,
      error: toUserFacingApiError(
        error,
        `${label} indisponible pour le moment.`,
      ),
    };
  }
}
