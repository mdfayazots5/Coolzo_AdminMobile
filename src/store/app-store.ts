/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { LocalStorage, StorageKey } from '../core/storage/local-storage';

interface AppState {
  isFirstLaunch: boolean;
  isOnboardingComplete: boolean;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  completeOnboarding: () => void;
  initialize: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isFirstLaunch: true,
  isOnboardingComplete: false,
  theme: 'system',

  setTheme: (theme) => {
    LocalStorage.set(StorageKey.APP_THEME, theme);
    set({ theme });
  },

  completeOnboarding: () => {
    LocalStorage.set(StorageKey.ONBOARDING_COMPLETE, true);
    set({ isOnboardingComplete: true });
  },

  initialize: () => {
    const theme = LocalStorage.get<'light' | 'dark' | 'system'>(StorageKey.APP_THEME) || 'system';
    const onboardingComplete = LocalStorage.get<boolean>(StorageKey.ONBOARDING_COMPLETE) || false;
    
    set({ 
      theme, 
      isOnboardingComplete: onboardingComplete,
      isFirstLaunch: !onboardingComplete 
    });
  },
}));
