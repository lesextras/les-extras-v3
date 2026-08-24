"use client";

// Les listes de choix de LEX : on coche, il comprend.
//
// Troisième chemin d'entrée du studio, à côté du formulaire libre et de
// l'import d'un écrit existant. Le catalogue vient de l'API — une seule
// source de vérité — et si l'appel échoue le formulaire reste utilisable
// sans les cases : mieux vaut moins de réglages qu'un écran bloqué.
import * as React from "react";
import { apiRequest } from "@/lib/api";

export interface OptionLex {
  cle: string;
  libelle: string;
}

export interface GroupeChoixLex {
  cle: string;
  titre: string;
  aide: string;
  multiple: boolean;
  max: number;
  choix: OptionLex[];
}

type FamilleLex = "activite" | "ecrit" | "appui";

type Catalogue = Record<FamilleLex, GroupeChoixLex[]>;

/** Charge le catalogue une fois. Un échec rend un tableau vide, jamais une erreur. */
export function useCatalogueLex(quoi: FamilleLex): GroupeChoixLex[] {
  const [groupes, setGroupes] = React.useState<GroupeChoixLex[]>([]);

  React.useEffect(() => {
    let vivant = true;
    apiRequest<Catalogue>("/assistant/options")
      .then((c) => {
        if (vivant) setGroupes(c?.[quoi] ?? []);
      })
      .catch(() => {
        if (vivant) setGroupes([]);
      });
    return () => {
      vivant = false;
    };
  }, [quoi]);

  return groupes;
}

function GroupeMultiple({ groupe }: { groupe: GroupeChoixLex }) {
  const [coches, setCoches] = React.useState<string[]>([]);
  const plein = coches.length >= groupe.max;

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-medium text-neutral-900">{groupe.titre}</legend>
      <p className="mt-0.5 text-xs text-neutral-500">
        {groupe.aide}{" "}
        <span className="whitespace-nowrap">
          ({coches.length}/{groupe.max})
        </span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {groupe.choix.map((c) => {
          const actif = coches.includes(c.cle);
          const bloque = plein && !actif;
          return (
            <label
              key={c.cle}
              className={
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors " +
                (actif
                  ? "border-teal-700 bg-teal-50 text-teal-800"
                  : bloque
                    ? "cursor-not-allowed border-neutral-200 text-neutral-300"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-400")
              }
            >
              <input
                type="checkbox"
                name={groupe.cle}
                value={c.cle}
                checked={actif}
                disabled={bloque}
                onChange={(e) =>
                  setCoches((prec) =>
                    e.target.checked ? [...prec, c.cle] : prec.filter((x) => x !== c.cle),
                  )
                }
                className="sr-only"
              />
              {c.libelle}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function GroupeUnique({ groupe }: { groupe: GroupeChoixLex }) {
  const [choisi, setChoisi] = React.useState("");

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-medium text-neutral-900">{groupe.titre}</legend>
      <p className="mt-0.5 text-xs text-neutral-500">{groupe.aide}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {[{ cle: "", libelle: "Peu importe" }, ...groupe.choix].map((c) => {
          const actif = choisi === c.cle;
          return (
            <label
              key={c.cle || "indifferent"}
              className={
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors " +
                (actif
                  ? "border-teal-700 bg-teal-50 text-teal-800"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-400")
              }
            >
              <input
                type="radio"
                name={groupe.cle}
                value={c.cle}
                checked={actif}
                onChange={() => setChoisi(c.cle)}
                className="sr-only"
              />
              {c.libelle}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Les cases se placent dans le même <form> que les champs texte : la
 * soumission les récupère avec `fd.getAll(cle)`, sans état à faire remonter.
 */
export function ChoixLex({ groupes }: { groupes: GroupeChoixLex[] }) {
  if (groupes.length === 0) return null;
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      {groupes.map((g) =>
        g.multiple ? (
          <GroupeMultiple key={g.cle} groupe={g} />
        ) : (
          <GroupeUnique key={g.cle} groupe={g} />
        ),
      )}
      <p className="text-xs text-neutral-500">
        Rien de coché ? LEX propose de lui-même. Ces choix cadrent la forme, jamais ce qui est dit
        d’une personne accompagnée.
      </p>
    </div>
  );
}
