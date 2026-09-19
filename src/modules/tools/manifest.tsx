import type { ToolDefinition } from '@/core/types';
import { Icon } from '@/core/icons';

export const toolsManifest: ToolDefinition[] = [
  {
    id: 'tools.json',
    title: 'JSON Formatter',
    description: 'Validate, pretty-print and minify JSON',
    keywords: ['json', 'format', 'beautify', 'minify', 'validate', 'offline'],
    group: 'Tools',
    icon: <Icon.file className="size-4" />,
    route: '/tools',
  },
  {
    id: 'tools.image',
    title: 'Image Resizer',
    description: 'Resize and export images locally via canvas',
    keywords: ['image', 'resize', 'scale', 'png', 'jpeg', 'webp', 'offline'],
    group: 'Tools',
    icon: <Icon.image className="size-4" />,
    route: '/tools',
  },
  {
    id: 'tools.text',
    title: 'Text Formatter',
    description: 'Case transforms, sort, dedupe, slugify, counts',
    keywords: ['text', 'case', 'uppercase', 'slug', 'sort', 'dedupe', 'offline'],
    group: 'Tools',
    icon: <Icon.text className="size-4" />,
    route: '/tools',
  },
  {
    id: 'tools.pdf',
    title: 'Text → PDF',
    description: 'Turn plain text into a downloadable PDF',
    keywords: ['pdf', 'export', 'document', 'print', 'offline'],
    group: 'Tools',
    icon: <Icon.pdf className="size-4" />,
    route: '/tools',
  },
  {
    id: 'tools.pdf-convert',
    title: 'PDF Converter',
    description: 'Convert DOCX, HTML, MD, RTF, CSV, XLSX, JSON, images and merge PDFs — offline',
    keywords: [
      'pdf', 'convert', 'converter', 'docx', 'word', 'html', 'markdown', 'rtf',
      'csv', 'tsv', 'excel', 'xlsx', 'xls', 'json', 'image', 'png', 'jpeg',
      'merge', 'combine', 'export', 'offline',
    ],
    group: 'Tools',
    icon: <Icon.pdf className="size-4" />,
    route: '/tools',
  },
];
