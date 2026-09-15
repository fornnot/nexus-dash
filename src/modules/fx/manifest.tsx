import type { ToolDefinition } from '@/core/types';
import { Icon } from '@/core/icons';

export const fxTools: ToolDefinition[] = [
  {
    id: 'fx.converter',
    title: 'Currency Converter',
    description: 'Convert between 11 fiat currencies and BTC',
    keywords: ['fx', 'currency', 'money', 'exchange', 'convert', 'usd', 'eur', 'btc'],
    group: 'FX',
    icon: <Icon.fx className="size-4" />,
    route: '/fx',
  },
  {
    id: 'fx.rates',
    title: 'Cross-rate Table',
    description: 'Latest rates for popular currencies',
    keywords: ['rates', 'table', 'fx', 'exchange'],
    group: 'FX',
    icon: <Icon.swap className="size-4" />,
    route: '/fx',
  },
];
