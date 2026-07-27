"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Shield,
  Moon,
  Sun,
  Globe,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  ChevronRight,
  Check,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
} from "@/components/ui/glass-card";
import { toast } from "sonner";
import { logout } from "@/app/actions/logout";
import { containerVariants, itemFadeUp, SPRING_SOFT } from "@/lib/motion";

/* ────────── types ────────── */
interface SettingRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  children: React.ReactNode;
}

/* ────────── helpers ────────── */
function SettingRow({ icon: Icon, label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ────────── page ────────── */
export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();

  /* ── notification prefs (local state for now) ── */
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [missionAlerts, setMissionAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  /* ── password change form ── */
  const [showPwd, setShowPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const handlePasswordChange = () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    startTransition(async () => {
      // Future: call API to change password
      toast.success("Mot de passe mis à jour avec succès");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-3xl"
    >
      {/* ─── Header ─── */}
      <motion.header variants={itemFadeUp} className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--teal-light))]">
            <Settings className="h-5 w-5 text-[hsl(var(--teal))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-sm text-muted-foreground">
              Gérez vos préférences et la sécurité de votre compte.
            </p>
          </div>
        </div>
      </motion.header>

      {/* ─── Notifications ─── */}
      <motion.div variants={itemFadeUp}>
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--teal)/0.1)] flex items-center justify-center">
                <Bell className="h-4 w-4 text-[hsl(var(--teal))]" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">Notifications</h2>
                <p className="text-xs text-muted-foreground">
                  Choisissez comment recevoir vos alertes
                </p>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="divide-y divide-border">
              <SettingRow
                icon={Mail}
                label="Notifications par e-mail"
                description="Recevez un e-mail pour chaque événement important"
              >
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              </SettingRow>
              <SettingRow
                icon={Smartphone}
                label="Notifications push"
                description="Activez les notifications sur votre appareil"
              >
                <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
              </SettingRow>
              <SettingRow
                icon={Bell}
                label="Alertes missions"
                description="Soyez notifié des nouvelles missions disponibles"
              >
                <Switch checked={missionAlerts} onCheckedChange={setMissionAlerts} />
              </SettingRow>
              <SettingRow
                icon={Shield}
                label="Alertes paiements"
                description="Recevez une alerte pour chaque transaction"
              >
                <Switch checked={paymentAlerts} onCheckedChange={setPaymentAlerts} />
              </SettingRow>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* ─── Sécurité ─── */}
      <motion.div variants={itemFadeUp}>
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--coral)/0.1)] flex items-center justify-center">
                <Lock className="h-4 w-4 text-[hsl(var(--coral))]" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">Sécurité</h2>
                <p className="text-xs text-muted-foreground">
                  Protégez votre compte avec un mot de passe fort
                </p>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs font-medium">
                  Mot de passe actuel
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPwd ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-medium">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="newPassword"
                    type={showPwd ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min. 8 caractères"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPwd ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Répétez le mot de passe"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handlePasswordChange}
                  disabled={isPending}
                  size="sm"
                  className="gap-2"
                >
                  <Check className="h-3.5 w-3.5" />
                  Changer le mot de passe
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* ─── Langue & Apparence ─── */}
      <motion.div variants={itemFadeUp}>
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--violet)/0.1)] flex items-center justify-center">
                <Globe className="h-4 w-4 text-[hsl(var(--violet))]" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">Préférences</h2>
                <p className="text-xs text-muted-foreground">
                  Langue et apparence de l&apos;interface
                </p>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="divide-y divide-border">
              <SettingRow
                icon={Globe}
                label="Langue"
                description="Langue de l'interface"
              >
                <Badge variant="outline" className="text-xs">
                  Français
                </Badge>
              </SettingRow>
              <SettingRow
                icon={Sun}
                label="Thème"
                description="Clair par défaut"
              >
                <Badge variant="outline" className="text-xs">
                  Clair
                </Badge>
              </SettingRow>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* ─── Zone Danger ─── */}
      <motion.div variants={itemFadeUp}>
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-red-600">Zone dangereuse</h2>
                <p className="text-xs text-muted-foreground">
                  Actions irréversibles sur votre compte
                </p>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="divide-y divide-border">
              <SettingRow
                icon={LogOut}
                label="Se déconnecter"
                description="Fermez votre session sur cet appareil"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Déconnexion
                </Button>
              </SettingRow>
              <SettingRow
                icon={Trash2}
                label="Supprimer mon compte"
                description="Cette action est définitive et irréversible"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => toast.info("Contactez le support pour supprimer votre compte.")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </SettingRow>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
