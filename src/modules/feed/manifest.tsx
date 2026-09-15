import type { ToolDefinition } from '@/core/types';
import { Icon } from '@/core/icons';

export const feedTools: ToolDefinition[] = [
  {
    id: 'feed.scores',
    title: 'Live Scores',
    description: 'Low-data sports scoreboard',
    keywords: ['scores', 'sports', 'football', 'nba', 'tennis', 'live'],
    group: 'Feed',
    icon: <Icon.live className="size-4" />,
    route: '/feed',
  },
  {
    id: 'feed.news',
    title: 'News — Nigeria & World',
    description: 'Nigerian and world headlines, low-data',
    keywords: ['news', 'nigeria', 'nigerian', 'headlines', 'world', 'feed', 'updates'],
    group: 'Feed',
    icon: <Icon.feed className="size-4" />,
    route: '/feed',
  },
];
