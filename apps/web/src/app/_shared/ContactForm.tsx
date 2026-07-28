"use client";

// Formulaire de contact public (sans authentification) — POST /public/contact.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { sourceAcquisition } from "@/lib/source";
import { Field, Textarea } from "./form-fields";

const SUBJECTS = [
  "Je suis un établissement",
  "Je suis un intervenant (freelance)",
  "Question sur une formation",
  "Autre",
];

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || "") || undefined,
      type: String(fd.get("type") || "") || undefined,
      content: String(fd.get("content") || ""),
      website: String(fd.get("website") || "") || undefined,
      source: sourceAcquisition(),
    };
    try {
      await apiRequest("/public/contact", { method: "POST", body });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <p className="text-lg font-semibold text-foreground">Message envoyé ✓</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Merci, votre demande a bien été transmise à l&apos;équipe ADéPA. Nous vous répondrons rapidement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
          {/* Champ-piège anti-robot : invisible pour un humain, rempli par les bots. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <label htmlFor="contact-website">Ne pas remplir</label>
            <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
          </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Votre nom" htmlFor="name" required>
          <Input id="name" name="name" required placeholder="Prénom Nom" />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <Input id="email" name="email" type="email" required placeholder="vous@exemple.fr" />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Téléphone" htmlFor="phone">
          <Input id="phone" name="phone" placeholder="06 12 34 56 78" />
        </Field>
        <Field label="Sujet" htmlFor="type">
          <select
            id="type"
            name="type"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            defaultValue={SUBJECTS[0]}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Votre message" htmlFor="content" required>
        <Textarea id="content" name="content" required rows={6} placeholder="Décrivez votre besoin…" />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Envoi…" : "Envoyer le message"}
      </Button>
    </form>
  );
}
