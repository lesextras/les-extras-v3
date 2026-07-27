export function usePathname() {
  return "/";
}

export function useRouter() {
  return {
    push: () => undefined,
    replace: () => undefined,
    refresh: () => undefined,
    prefetch: () => Promise.resolve(),
    back: () => undefined,
    forward: () => undefined,
  };
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function useParams() {
  return {};
}

export function redirect(path: string): never {
  throw new Error(`NEXT_REDIRECT:${path}`);
}

export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}
