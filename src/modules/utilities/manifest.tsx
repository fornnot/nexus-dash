import type { ToolDefinition } from '@/core/types';
import { Icon } from '@/core/icons';

export const utilityTools: ToolDefinition[] = [
  {
    id: 'utilities.json',
    title: 'JSON Formatter',
    description: 'Validate, pretty-print and minify JSON',
    keywords: ['json', 'format', 'beautify', 'minify', 'validate', 'offline'],
    group: 'Utilities',
    icon: <Icon.file className="size-4" />,
    route: '/utilities',
  },
  {
    id: 'utilities.image',
    title: 'Image Resizer',
    description: 'Resize and export images locally via canvas',
    keywords: ['image', 'resize', 'scale', 'png', 'jpeg', 'webp', 'offline'],
    group: 'Utilities',
    icon: <Icon.image className="size-4" />,
    route: '/utilities',
  },
  {
    id: 'utilities.text',
    title: 'Text Formatter',
    description: 'Case transforms, sort, dedupe, slugify, counts',
    keywords: ['text', 'case', 'uppercase', 'slug', 'sort', 'dedupe', 'offline'],
    group: 'Utilities',
    icon: <Icon.text className="size-4" />,
    route: '/utilities',
  },
  {
    id: 'utilities.pdf',
    title: 'Text → PDF',
    description: 'Turn plain text into a downloadable PDF',
    keywords: ['pdf', 'export', 'document', 'print', 'offline'],
    group: 'Utilities',
    icon: <Icon.pdf className="size-4" />,
    route: '/utilities',
  },
];
