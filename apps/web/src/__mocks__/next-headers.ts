export const cookies = () => ({
  get: (_name: string) => undefined,
  set: () => {},
  delete: () => {},
});
export const headers = () => new Map<string, string>();
