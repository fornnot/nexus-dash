import type { ToolDefinition } from '@/core/types';
import { Icon } from '@/core/icons';

export const newsTools: ToolDefinition[] = [
  {
    id: 'news.home',
    title: 'News — Nigeria & World',
    description: 'Nigerian and world headlines, low-data long scroll',
    keywords: ['news', 'nigeria', 'nigerian', 'headlines', 'world', 'feed', 'updates'],
    group: 'News',
    icon: <Icon.feed className="size-4" />,
    route: '/news',
  },
];
