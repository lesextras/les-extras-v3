"use client";

import { create } from "zustand";

export type UserRole = "ESTABLISHMENT" | "FREELANCE";

export interface UIState {
  isRenfortModalOpen: boolean;
  isPublishModalOpen: boolean;
  userRole: "ESTABLISHMENT" | "FREELANCE" | null;
  onboardingStep: number;
  isMobileOpen: boolean;

  // SOS Renfort multi-step state
  renfortStep: number;
  renfortStepDir: number;

  // Service modals
  isServiceModalOpen: boolean;
  serviceModalId: string | null;
  isBookServiceModalOpen: boolean;
  bookServiceModalId: string | null;
  isQuoteRequestModalOpen: boolean;
  quoteRequestServiceId: string | null;
  isQuoteEditorModalOpen: boolean;
  quoteEditorQuoteId: string | null;

  openRenfortModal: () => void;
  closeRenfortModal: () => void;
  openPublishModal: () => void;
  closePublishModal: () => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
  setUserRole: (role: "ESTABLISHMENT" | "FREELANCE" | null) => void;
  setOnboardingStep: (step: number) => void;
  setRenfortStep: (step: number) => void;
  setRenfortStepDir: (dir: number) => void;

  // Service modal actions
  openServiceModal: (serviceId: string) => void;
  closeServiceModal: () => void;
  openBookServiceModal: (serviceId: string) => void;
  closeBookServiceModal: () => void;
  openQuoteRequestModal: (serviceId: string) => void;
  closeQuoteRequestModal: () => void;
  openQuoteEditorModal: (quoteId: string) => void;
  closeQuoteEditorModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isRenfortModalOpen: false,
  isPublishModalOpen: false,
  isMobileOpen: false,
  // null = rôle pas encore hydraté (avant que OnboardingGuard appelle setUserRole)
  userRole: null,
  onboardingStep: 0,
  renfortStep: 0,
  renfortStepDir: 1,

  // Service modals initial state
  isServiceModalOpen: false,
  serviceModalId: null,
  isBookServiceModalOpen: false,
  bookServiceModalId: null,
  isQuoteRequestModalOpen: false,
  quoteRequestServiceId: null,
  isQuoteEditorModalOpen: false,
  quoteEditorQuoteId: null,

  openRenfortModal: () => set({ isRenfortModalOpen: true, renfortStep: 0, renfortStepDir: 1 }),
  closeRenfortModal: () => set({ isRenfortModalOpen: false, renfortStep: 0 }),
  openPublishModal: () => set({ isPublishModalOpen: true }),
  closePublishModal: () => set({ isPublishModalOpen: false }),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
  setUserRole: (role) => set({ userRole: role }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  setRenfortStep: (step) => set({ renfortStep: step }),
  setRenfortStepDir: (dir) => set({ renfortStepDir: dir }),

  // Service modal actions
  openServiceModal: (serviceId) => set({ isServiceModalOpen: true, serviceModalId: serviceId }),
  closeServiceModal: () => set({ isServiceModalOpen: false, serviceModalId: null }),
  openBookServiceModal: (serviceId) => set({ isBookServiceModalOpen: true, bookServiceModalId: serviceId }),
  closeBookServiceModal: () => set({ isBookServiceModalOpen: false, bookServiceModalId: null }),
  openQuoteRequestModal: (serviceId) => set({ isQuoteRequestModalOpen: true, quoteRequestServiceId: serviceId }),
  closeQuoteRequestModal: () => set({ isQuoteRequestModalOpen: false, quoteRequestServiceId: null }),
  openQuoteEditorModal: (quoteId) => set({ isQuoteEditorModalOpen: true, quoteEditorQuoteId: quoteId }),
  closeQuoteEditorModal: () => set({ isQuoteEditorModalOpen: false, quoteEditorQuoteId: null }),
}));
