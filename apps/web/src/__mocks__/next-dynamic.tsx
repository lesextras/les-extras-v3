import type { ComponentType } from "react";

export default function dynamic<TProps extends object = Record<string, never>>() {
  return (() => null) as ComponentType<TProps>;
}
