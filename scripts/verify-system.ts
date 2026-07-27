type DemoRole = "ESTABLISHMENT" | "FREELANCE";

type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: DemoRole;
  };
};

type MissionResponse = {
  id: string;
  title: string;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
};

type BookingResponse = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";
  reliefMissionId: string | null;
};

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "LesExtrasDemo!2026";

const DEMO_USERS = {
  ESTABLISHMENT: "directeur@mecs-avenir.fr",
  FREELANCE: "karim.educ@gmail.com",
} as const;

type RequestOptions = {
  method: "GET" | "POST";
  path: string;
  token?: string;
  body?: unknown;
};

async function apiRequest<T>(options: RequestOptions): Promise<{ status: number; data: T }> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${options.path.startsWith("/") ? options.path : `/${options.path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method,
      headers: {
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "network error";
    throw new Error(`Cannot reach API at ${url}: ${reason}`);
  }

  const rawText = await response.text();
  let payload: unknown = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `HTTP ${response.status}`;
    throw new Error(`${options.method} ${options.path} failed: ${message}`);
  }

  return {
    status: response.status,
    data: payload as T,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function login(role: DemoRole): Promise<AuthResponse> {
  const email = DEMO_USERS[role];
  const { status, data } = await apiRequest<AuthResponse>({
    method: "POST",
    path: "/auth/login",
    body: {
      email,
      password: DEMO_PASSWORD,
    },
  });

  assert(status === 201 || status === 200, `Unexpected login status for ${role}: ${status}`);
  assert(data.accessToken, `Missing accessToken for ${role}`);
  assert(data.user?.id, `Missing user.id for ${role}`);
  return data;
}

async function main() {
  console.log("== LesExtras verify-system ==");
  console.log(`API base URL: ${API_BASE_URL}`);

  console.log("1) Auth - login establishment");
  const clientAuth = await login("ESTABLISHMENT");
  console.log(`   OK establishment: ${clientAuth.user.email} (${clientAuth.user.id})`);

  console.log("2) Auth - login freelance");
  const talentAuth = await login("FREELANCE");
  console.log(`   OK freelance: ${talentAuth.user.email} (${talentAuth.user.id})`);

  const dateStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const dateEnd = new Date(dateStart.getTime() + 8 * 60 * 60 * 1000);
  const missionTitle = `Smoke SOS ${new Date().toISOString()}`;

  console.log("3) Flow Establishment - create mission");
  const createMission = await apiRequest<MissionResponse>({
    method: "POST",
    path: "/missions",
    token: clientAuth.accessToken,
    body: {
      title: missionTitle,
      dateStart: dateStart.toISOString(),
      dateEnd: dateEnd.toISOString(),
      hourlyRate: 28,
      address: "10 Rue de la Demo, 75011 Paris",
    },
  });

  assert(createMission.status === 201, `Unexpected create mission status: ${createMission.status}`);
  assert(createMission.data.id, "Mission ID missing after creation");
  console.log(`   OK mission created: ${createMission.data.id}`);

  console.log("4) Flow Freelance - fetch missions feed");
  const missionsFeed = await apiRequest<MissionResponse[]>({
    method: "GET",
    path: "/missions",
    token: talentAuth.accessToken,
  });

  assert(missionsFeed.status === 200, `Unexpected missions feed status: ${missionsFeed.status}`);
  const foundMission = missionsFeed.data.find((mission) => mission.id === createMission.data.id);
  assert(foundMission, "Created mission not found in talent feed");
  console.log("   OK mission visible in talent feed");

  console.log("5) Interaction - freelance applies to mission");
  const applyResponse = await apiRequest<BookingResponse>({
    method: "POST",
    path: `/missions/${createMission.data.id}/apply`,
    token: talentAuth.accessToken,
  });

  assert(applyResponse.status === 201, `Unexpected apply status: ${applyResponse.status}`);
  assert(
    applyResponse.data.reliefMissionId === createMission.data.id,
    "Booking reliefMissionId does not match created mission",
  );
  console.log(`   OK booking created: ${applyResponse.data.id} (${applyResponse.data.status})`);

  console.log("Verification completed successfully.");
}

void main().catch((error: unknown) => {
  console.error("Verification failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
