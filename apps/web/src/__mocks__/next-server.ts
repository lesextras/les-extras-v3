type StoredCookie = {
  name: string;
  value: string;
};

class RequestCookies {
  private readonly values = new Map<string, StoredCookie>();

  get(name: string) {
    return this.values.get(name);
  }

  set(name: string, value: string) {
    this.values.set(name, { name, value });
  }
}

export class NextRequest {
  readonly cookies = new RequestCookies();
  readonly nextUrl: URL;
  readonly url: string;

  constructor(input: string | URL) {
    this.url = input.toString();
    this.nextUrl = new URL(this.url);
  }
}

export class NextResponse {
  readonly headers: Headers;
  readonly status: number;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.headers = new Headers(init?.headers);
    this.status = init?.status ?? 200;
  }

  static next() {
    return new NextResponse(null, { status: 200 });
  }

  static redirect(url: string | URL) {
    return new NextResponse(null, {
      status: 307,
      headers: { location: url.toString() },
    });
  }
}
