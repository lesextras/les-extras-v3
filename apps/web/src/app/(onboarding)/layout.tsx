import type { Metadata } from "next";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const metadata: Metadata = {
    title: "Onboarding - Les Extras",
};

export default function OnboardingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className="fixed top-4 right-4 z-50">
                <ThemeSwitcher />
            </div>
            {children}
        </>
    );
}
