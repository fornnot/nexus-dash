import type { ToolDefinition } from '@/core/types';
import { Icon } from '@/core/icons';

export const sportTools: ToolDefinition[] = [
  {
    id: 'sport.scores',
    title: 'Live Scores',
    description: 'Every major league — football, basketball, NFL, MLB, NHL',
    keywords: ['scores', 'sports', 'football', 'soccer', 'nba', 'nfl', 'mlb', 'nhl', 'live'],
    group: 'Sport',
    icon: <Icon.live className="size-4" />,
    route: '/sport',
  },
];
