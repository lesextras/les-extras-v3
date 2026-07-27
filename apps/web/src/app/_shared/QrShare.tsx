"use client";

// QR code de la fiche : à afficher, télécharger ou partager. Sur le terrain, un
// QR imprimé sur une affiche vaut mieux qu'une URL qu'on recopie à la main.
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Download, Share2, QrCode, Link2 } from "lucide-react";

export function QrShare({
  path,
  title,
  fileName,
}: {
  /** Chemin de la fiche, ex. "/ateliers/abc". */
  path: string;
  title: string;
  fileName: string;
}) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    const complet = `${window.location.origin}${path}`;
    setUrl(complet);
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, complet, {
      width: 240,
      margin: 1,
      color: { dark: "#183767", light: "#FFFFFF" },
    }).catch(() => undefined);
  }, [path, ouvert]);

  function telecharger() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `qr-${fileName}.png`;
    a.click();
    toast({ title: "QR code téléchargé" });
  }

  async function partager() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Lien copié" });
      }
    } catch {
      /* partage annulé par la personne : rien à signaler */
    }
  }

  async function copier() {
    await navigator.clipboard.writeText(url);
    toast({ title: "Lien copié" });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          className="flex w-full items-center justify-between text-left"
          aria-expanded={ouvert}
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <QrCode className="size-4" /> Partager cette fiche
          </span>
          <span className="text-muted-foreground">{ouvert ? "−" : "+"}</span>
        </button>

        <div className={ouvert ? "space-y-3" : "hidden"}>
          <div className="flex justify-center rounded-xl bg-white p-3">
            <canvas ref={canvasRef} aria-label={`QR code vers ${title}`} />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            À imprimer sur une affiche ou à projeter en réunion.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={telecharger}>
              <Download className="size-4" /> PNG
            </Button>
            <Button variant="outline" size="sm" onClick={partager}>
              <Share2 className="size-4" /> Partager
            </Button>
            <Button variant="outline" size="sm" onClick={copier}>
              <Link2 className="size-4" /> Lien
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
