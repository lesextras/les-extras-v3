import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-6xl font-extrabold text-violet-600">404</h1>
      <h2 className="text-xl font-semibold">Page introuvable</h2>
      <p className="max-w-md text-gray-600">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
