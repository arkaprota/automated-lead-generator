import type { ComponentProps } from 'react';
import type { ClerkProvider } from '@clerk/nextjs';

type ClerkAppearance = ComponentProps<typeof ClerkProvider>['appearance'];

/** Clerk screens themed from .agents/design.md (dark obsidian, glass surfaces, Sky 600 primary). */
export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: '#0284c7',
    colorPrimaryForeground: '#f8fafc',
    colorBackground: '#0f172a',
    colorForeground: '#f8fafc',
    colorMutedForeground: '#94a3b8',
    colorNeutral: '#94a3b8',
    colorInput: '#020617',
    colorInputForeground: '#f8fafc',
    colorBorder: 'rgba(255, 255, 255, 0.08)',
    colorDanger: '#fb7185',
    colorSuccess: '#34d399',
    borderRadius: '0.75rem',
    fontFamily: 'inherit',
  },
  elements: {
    card: 'shadow-2xl shadow-sky-950/40 border border-white/10',
    rootBox: 'w-full',
  },
};
