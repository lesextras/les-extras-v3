"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { updateFreelanceProfile } from "@/app/actions/profile";
import { Separator } from "@/components/ui/separator";

// Match the schema in the action (duplicated for client-side valid, ideally shared)
const profileSchema = z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    jobTitle: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    siret: z.string().optional(),
    tvaNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    initialData: Partial<ProfileFormValues> & { email?: string };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [newSkill, setNewSkill] = useState("");

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: initialData.firstName || "",
            lastName: initialData.lastName || "",
            jobTitle: initialData.jobTitle || "",
            bio: initialData.bio || "",
            skills: initialData.skills || [],
            phone: initialData.phone || "",
            address: initialData.address || "",
            city: initialData.city || "",
            zipCode: initialData.zipCode || "",
            siret: initialData.siret || "",
            tvaNumber: initialData.tvaNumber || "",
        },
    });

    async function onSubmit(data: ProfileFormValues) {
        setLoading(true);
        const result = await updateFreelanceProfile(data);
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Profil mis à jour avec succès");
        }
    }

    const addSkill = () => {
        if (newSkill.trim()) {
            const currentSkills = form.getValues("skills") || [];
            if (!currentSkills.includes(newSkill.trim())) {
                form.setValue("skills", [...currentSkills, newSkill.trim()]);
            }
            setNewSkill("");
        }
    };

    const removeSkill = (skillToRemove: string) => {
        const currentSkills = form.getValues("skills") || [];
        form.setValue("skills", currentSkills.filter(s => s !== skillToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* SECTION 1: IDENTITÉ */}
                <Card>
                    <CardHeader>
                        <CardTitle>Identité</CardTitle>
                        <CardDescription>Vos informations personnelles visibles par les établissements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            {/* Avatar Placeholder */}
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                                <span className="text-xs">Avatar</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-medium">Photo de profil</h3>
                                <p className="text-sm text-muted-foreground">Une photo professionnelle rassure les établissements.</p>
                                <Button variant="outline" size="sm" type="button" disabled>Modifier (Bientôt)</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prénom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Jean" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dupont" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="jobTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Titre du poste / Spécialité</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Infirmier DE, Aide-Soignant..." {...field} />
                                    </FormControl>
                                    <FormDescription>Ce titre apparaîtra sous votre nom.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* SECTION 2: EXPERTISE */}
                <Card>
                    <CardHeader>
                        <CardTitle>Expertise</CardTitle>
                        <CardDescription>Mettez en avant vos compétences et votre expérience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bio / Présentation</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Présentez votre parcours, vos expériences clés et ce que vous recherchez..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="skills"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Compétences (Tags)</FormLabel>
                                    <FormControl>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Ajouter une compétence (ex: Urgences, Pédiatrie)..."
                                                    value={newSkill}
                                                    onChange={(e) => setNewSkill(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                />
                                                <Button type="button" onClick={addSkill} variant="secondary">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {field.value?.map((skill, index) => (
                                                    <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                                                        {skill}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            type="button"
                                                            onClick={() => removeSkill(skill)}
                                                            className="h-4 w-4 ml-1 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </Badge>
                                                ))}
                                                {(!field.value || field.value.length === 0) && (
                                                    <span className="text-sm text-muted-foreground italic">Aucune compétence ajoutée.</span>
                                                )}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* SECTION 3: ADMINISTRATIF */}
                <Card>
                    <CardHeader>
                        <CardTitle>Administratif</CardTitle>
                        <CardDescription>Informations légales et coordonnées.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Téléphone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="06 12 34 56 78" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="siret"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Numéro SIRET</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 456 789 00012" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adresse</FormLabel>
                                    <FormControl>
                                        <Input placeholder="10 rue de la Paix" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="zipCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Code Postal</FormLabel>
                                        <FormControl>
                                            <Input placeholder="75001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ville</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Paris" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="tvaNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Numéro de TVA (Optionnel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="FR..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </Form>
    );
}
