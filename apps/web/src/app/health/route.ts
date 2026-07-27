export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "lesextras-web",
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}
