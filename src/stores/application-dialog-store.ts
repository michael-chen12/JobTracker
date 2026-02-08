import { create } from 'zustand';

interface ApplicationDialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

/**
 * Global store for the ApplicationFormDialog open/close state.
 * Needed because the BottomNav (layout-level) and DashboardClient (page-level)
 * both need to control the dialog, but live outside each other's provider scope.
 */
export const useApplicationDialogStore = create<ApplicationDialogState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
