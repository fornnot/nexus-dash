import { lazy } from 'react';
import type { ModuleDefinition, ModuleId } from '@/core/types';
import { Icon } from '@/core/icons';

/**
 * Central module registry. Each module ships a `manifest.ts` describing its
 * identity + tools; the shell only depends on these, never on internals.
 */
const FXModule = lazy(() => import('@/modules/fx/FXModule'));
const UtilitiesModule = lazy(() => import('@/modules/utilities/UtilitiesModule'));
const FeedModule = lazy(() => import('@/modules/feed/FeedModule'));

export const modules: ModuleDefinition[] = [
  {
    id: 'fx',
    name: 'FX & Finance',
    tagline: 'Live currency rates, converter and cross-rates.',
    icon: <Icon.fx className="size-5" />,
    accent: 'text-cyan-300',
    path: '/fx',
    component: FXModule,
    tools: [], // populated by the module's own manifest below
  },
  {
    id: 'utilities',
    name: 'Offline Utilities',
    tagline: 'JSON, image, text and PDF tools that run 100% client-side.',
    icon: <Icon.utilities className="size-5" />,
    accent: 'text-violet-300',
    path: '/utilities',
    component: UtilitiesModule,
    tools: [],
  },
  {
    id: 'feed',
    name: 'Live Feed',
    tagline: 'Low-data sports scores and micro-news.',
    icon: <Icon.feed className="size-5" />,
    accent: 'text-emerald-300',
    path: '/feed',
    component: FeedModule,
    tools: [],
  },
];

// Attach tool lists (kept next to the module code that owns them).
import { fxTools } from '@/modules/fx/manifest';
import { utilityTools } from '@/modules/utilities/manifest';
import { feedTools } from '@/modules/feed/manifest';

modules[0].tools = fxTools;
modules[1].tools = utilityTools;
modules[2].tools = feedTools;

export const moduleById: Record<ModuleId, ModuleDefinition | undefined> = {
  ...Object.fromEntries(modules.map((m) => [m.id, m])),
} as Record<ModuleId, ModuleDefinition | undefined>;

export const allTools = modules.flatMap((m) => m.tools);
