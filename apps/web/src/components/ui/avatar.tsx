'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Avatar composé (API shadcn/ui) : <Avatar><AvatarImage/><AvatarFallback/></Avatar>.
 * L'image s'efface automatiquement en cas d'erreur de chargement, révélant le
 * fallback (initiales). Sans dépendance Radix.
 */

interface AvatarContextValue {
  imageLoaded: boolean;
  imageError: boolean;
  setImageLoaded: (v: boolean) => void;
  setImageError: (v: boolean) => void;
}
const AvatarContext = React.createContext<AvatarContextValue | null>(null);

const Avatar = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);
    return (
      <AvatarContext.Provider value={{ imageLoaded, imageError, setImageLoaded, setImageError }}>
        <span
          ref={ref}
          className={cn(
            'relative flex h-10 w-10 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary-soft ring-1 ring-border',
            className,
          )}
          {...props}
        />
      </AvatarContext.Provider>
    );
  },
);
Avatar.displayName = 'Avatar';

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt = '', onLoad, onError, ...props }, ref) => {
    const ctx = React.useContext(AvatarContext);
    if (!src || ctx?.imageError) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn('h-full w-full object-cover', className)}
        onLoad={(e) => {
          ctx?.setImageLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          ctx?.setImageError(true);
          onError?.(e);
        }}
        {...props}
      />
    );
  },
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    const ctx = React.useContext(AvatarContext);
    // Cache le fallback si une image est chargée avec succès.
    if (ctx?.imageLoaded && !ctx.imageError) return null;
    return (
      <span
        ref={ref}
        className={cn(
          'flex h-full w-full items-center justify-center text-sm font-semibold text-accent-foreground',
          className,
        )}
        {...props}
      />
    );
  },
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
