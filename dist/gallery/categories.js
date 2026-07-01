import { getTemplates } from '@antv/infographic';
const CATEGORY_LABELS = {
    'chart-bar': 'chart-bar',
    'chart-column': 'chart-column',
    'chart-line': 'chart-line',
    'chart-pie': 'chart-pie',
    'chart-wordcloud': 'chart-wordcloud',
    'compare-binary': 'compare-binary',
    'compare-hierarchy': 'compare-hierarchy',
    'compare-quadrant-quarter': 'quadrant-quarter',
    'compare-quadrant-simple': 'quadrant-simple',
    'compare-swot': 'compare-swot',
    'mind-map': 'Mind Map',
    'hierarchy-structure': 'hierarchy-structure',
    'hierarchy-tree': 'Hierarchy Tree',
    'list-column': 'list-column',
    'list-grid': 'list-grid',
    'list-pyramid': 'list-pyramid',
    'list-row': 'list-row',
    'list-sector': 'list-sector',
    'list-waterfall': 'list-waterfall',
    'list-zigzag': 'list-zigzag',
    'relation-circle': 'relation-circle',
    'relation-dagre': 'relation-dagre',
    'relation-network': 'relation-network',
    'sequence-ascending': 'sequence-ascending',
    'sequence-circle': 'sequence-circle',
    'sequence-circular': 'sequence-circular',
    'sequence-color': 'sequence-color',
    'sequence-cylinders': 'sequence-cylinders',
    'sequence-filter': 'sequence-filter',
    'sequence-funnel': 'sequence-funnel',
    'sequence-horizontal': 'sequence-horizontal',
    'sequence-interaction': 'sequence-interaction',
    'sequence-mountain': 'sequence-mountain',
    'sequence-pyramid': 'sequence-pyramid',
    'sequence-roadmap': 'sequence-roadmap',
    'sequence-snake': 'sequence-snake',
    'sequence-stairs': 'sequence-stairs',
    'sequence-steps': 'sequence-steps',
    'sequence-timeline': 'sequence-timeline',
    'sequence-zigzag': 'sequence-zigzag',
};
export function getCategoryId(slug) {
    if (slug.startsWith('hierarchy-mindmap-'))
        return 'mind-map';
    if (slug.startsWith('hierarchy-tree-'))
        return 'hierarchy-tree';
    if (slug.startsWith('compare-quadrant-quarter-'))
        return 'compare-quadrant-quarter';
    if (slug.startsWith('compare-quadrant-simple-'))
        return 'compare-quadrant-simple';
    if (slug.startsWith('relation-dagre-'))
        return 'relation-dagre';
    if (slug.startsWith('sequence-interaction-'))
        return 'sequence-interaction';
    const parts = slug.split('-');
    if (parts[0] === 'chart' ||
        parts[0] === 'compare' ||
        parts[0] === 'hierarchy' ||
        parts[0] === 'list' ||
        parts[0] === 'relation' ||
        parts[0] === 'sequence') {
        return `${parts[0]}-${parts[1]}`;
    }
    return parts[0] ?? slug;
}
export function getCategoryLabel(categoryId) {
    return CATEGORY_LABELS[categoryId] ?? categoryId;
}
export function getGalleryCategories() {
    const grouped = new Map();
    for (const slug of getTemplates()) {
        const categoryId = getCategoryId(slug);
        const list = grouped.get(categoryId) ?? [];
        list.push(slug);
        grouped.set(categoryId, list);
    }
    return [...grouped.entries()]
        .map(([id, templates]) => ({
        id,
        label: getCategoryLabel(id),
        templates: templates.sort(),
    }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
export function getGalleryTemplateUrl(slug) {
    return `https://infographic.antv.vision/gallery/${slug}`;
}
export const GALLERY_TEMPLATE_COUNT = getTemplates().length;
