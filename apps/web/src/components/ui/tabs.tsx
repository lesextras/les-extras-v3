'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Tabs contrôlées ou non contrôlées, sans dépendance externe. */

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

const tabId = (base: string, v: string) => `${base}-tab-${v}`;
const panelId = (base: string, v: string) => `${base}-panel-${v}`;

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Les composants Tabs doivent être dans <Tabs>.');
  return ctx;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({ value, defaultValue, onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const current = value ?? internal;
  const baseId = React.useId();
  const setValue = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [value, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, setValue, baseId }}>
      <div className={cn('flex flex-col gap-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn('inline-flex h-11 items-center gap-1 rounded-xl bg-muted p-1', className)}
      {...props}
    />
  ),
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onKeyDown, ...props }, ref) => {
    const { value: current, setValue, baseId } = useTabs();
    const active = current === value;

    function onNav(e: React.KeyboardEvent<HTMLButtonElement>) {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      const list = e.currentTarget.closest('[role="tablist"]');
      if (!list) return;
      const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'));
      const idx = tabs.indexOf(e.currentTarget);
      let next = -1;
      if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next < 0) return;
      e.preventDefault();
      tabs[next]?.focus();
      tabs[next]?.click();
    }

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        id={tabId(baseId, value)}
        aria-selected={active}
        aria-controls={panelId(baseId, value)}
        tabIndex={active ? 0 : -1}
        onKeyDown={onNav}
        onClick={() => setValue(value)}
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all',
          active
            ? 'bg-card text-foreground shadow-soft'
            : 'text-muted-foreground hover:text-foreground',
          className,
        )}
        {...props}
      />
    );
  },
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { value: current, baseId } = useTabs();
    if (current !== value) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        id={panelId(baseId, value)}
        aria-labelledby={tabId(baseId, value)}
        tabIndex={0}
        className={cn('animate-fade-in focus-visible:outline-none', className)}
        {...props}
      />
    );
  },
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
