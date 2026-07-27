"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, type UserProfile } from "@/app/actions/user";

export function useCurrentUser() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getCurrentUser()
            .then((data) => {
                if (!cancelled) setUser(data);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    return { user, loading };
}
