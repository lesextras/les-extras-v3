import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AuthLayout({
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
