"use client";

import { useState, useEffect } from "react";

/**
 * React hook that listens for a CSS media query match.
 * Returns `true` if the query matches, `false` otherwise.
 * Returns `false` during SSR to avoid hydration mismatches.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);

        setMatches(mql.matches);
        mql.addEventListener("change", handleChange);

        return () => mql.removeEventListener("change", handleChange);
    }, [query]);

    return matches;
}
