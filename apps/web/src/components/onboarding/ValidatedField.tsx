"use client";

import { useState, useCallback, type ReactNode } from "react";
import { Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ValidatedFieldProps = {
    id: string;
    label: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    validate?: (value: string) => string | null;
    placeholder?: string;
    type?: string;
    maxLength?: number;
    children?: ReactNode;
};

export function ValidatedField({
    id,
    label,
    required,
    value,
    onChange,
    validate,
    placeholder,
    type = "text",
    maxLength,
    children,
}: ValidatedFieldProps) {
    const [touched, setTouched] = useState(false);
    const [shaking, setShaking] = useState(false);

    const error = touched && validate ? validate(value) : null;
    const isValid = touched && !error && value.length > 0;

    const handleBlur = useCallback(() => {
        setTouched(true);
        if (validate && validate(value)) {
            setShaking(true);
            setTimeout(() => setShaking(false), 400);
        }
    }, [validate, value]);

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label}
                {required && (
                    <span className="ml-0.5 text-[hsl(var(--coral))]">*</span>
                )}
            </Label>

            {children ? (
                /* Custom children (Select, Textarea, etc.) */
                children
            ) : (
                <div className={cn("relative", shaking && "field-shake")}>
                    <Input
                        id={id}
                        type={type}
                        className={cn(
                            "h-11 rounded-xl pr-10 transition-all duration-200",
                            error && "border-[hsl(var(--status-error))] focus-visible:ring-[hsl(var(--status-error)/0.3)]",
                            isValid && "border-[hsl(var(--teal)/0.4)] focus-visible:ring-[hsl(var(--teal)/0.3)]"
                        )}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onBlur={handleBlur}
                        maxLength={maxLength}
                    />

                    {/* Status icon */}
                    {touched && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isValid ? (
                                <Check className="h-4 w-4 text-[hsl(var(--teal))]" />
                            ) : error ? (
                                <AlertCircle className="h-4 w-4 text-[hsl(var(--status-error))]" />
                            ) : null}
                        </div>
                    )}
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="text-xs text-[hsl(var(--status-error))] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
}
