import Link from 'next/link';
import { Accent, CARTE } from './_ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[600px]">
      <div className={`${CARTE} p-6 sm:p-9`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#12312A]">
          Cette page n&apos;<Accent>existe pas</Accent>.
        </h1>
        <p className="mt-3 leading-relaxed">
          Elle a peut-être changé d&apos;adresse, ou le lien s&apos;est abîmé en route.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/academie" className="rounded-xl bg-[#1E9E6A] px-5 py-3 font-bold text-white no-underline hover:bg-[#17845A]">
            Retour à l&apos;accueil
          </Link>
          <Link href="/academie/chemin" className="rounded-xl border-2 border-[#CFE4D9] px-5 py-[10px] font-bold text-[#12312A] no-underline hover:border-[#1E9E6A]">
            Voir le chemin
          </Link>
        </div>
      </div>
    </div>
  );
}
