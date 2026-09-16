import { lazy } from 'react';
import type { ModuleDefinition, ModuleId } from '@/core/types';
import { Icon } from '@/core/icons';

/**
 * Central module registry. Each module ships a `manifest` describing its
 * identity + tools; the shell only depends on these, never on internals.
 * The tab order here (News, Sport, FX, Tools) is the bottom-bar order.
 */
const NewsPage = lazy(() => import('@/modules/news/News'));
const SportPage = lazy(() => import('@/modules/sport/Scores'));
const FXModule = lazy(() => import('@/modules/fx/FXModule'));
const ToolsModule = lazy(() => import('@/modules/tools/ToolsModule'));

export const modules: ModuleDefinition[] = [
  {
    id: 'news',
    name: 'News',
    tagline: 'Nigerian and world headlines, on the home tab.',
    icon: <Icon.feed className="size-5" />,
    accent: 'text-emerald-300',
    path: '/news',
    component: NewsPage,
    tools: [],
  },
  {
    id: 'sport',
    name: 'Sport',
    tagline: 'Every major league, live scores.',
    icon: <Icon.live className="size-5" />,
    accent: 'text-emerald-300',
    path: '/sport',
    component: SportPage,
    tools: [],
  },
  {
    id: 'fx',
    name: 'FX',
    tagline: 'Live currency rates, converter and cross-rates.',
    icon: <Icon.fx className="size-5" />,
    accent: 'text-cyan-300',
    path: '/fx',
    component: FXModule,
    tools: [],
  },
  {
    id: 'tools',
    name: 'Tools',
    tagline: 'JSON, image, text and PDF tools that run 100% client-side.',
    icon: <Icon.utilities className="size-5" />,
    accent: 'text-violet-300',
    path: '/tools',
    component: ToolsModule,
    tools: [],
  },
];

// Attach tool lists (kept next to the module code that owns them).
import { fxTools } from '@/modules/fx/manifest';
import { toolsManifest } from '@/modules/tools/manifest';
import { newsTools } from '@/modules/news/manifest';
import { sportTools } from '@/modules/sport/manifest';

modules[0].tools = newsTools;
modules[1].tools = sportTools;
modules[2].tools = fxTools;
modules[3].tools = toolsManifest;

export const moduleById: Record<ModuleId, ModuleDefinition | undefined> = {
  ...Object.fromEntries(modules.map((m) => [m.id, m])),
} as Record<ModuleId, ModuleDefinition | undefined>;

export const allTools = modules.flatMap((m) => m.tools);
