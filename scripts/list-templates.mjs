import { getTemplates } from '@antv/infographic';

const templates = getTemplates();
console.log('Total templates:', templates.length);
console.log('Sample:', templates.slice(0, 15));

const prefixes = new Map();
for (const slug of templates) {
  const parts = slug.split('-');
  let prefix = parts[0];
  if (parts[0] === 'chart' || parts[0] === 'compare' || parts[0] === 'hierarchy' || parts[0] === 'list' || parts[0] === 'relation' || parts[0] === 'sequence') {
    prefix = `${parts[0]}-${parts[1]}`;
    if (parts[0] === 'compare' && parts[1] === 'quadrant') prefix = `${parts[0]}-${parts[1]}-${parts[2]}`;
    if (parts[0] === 'hierarchy' && parts[1] === 'mindmap') prefix = 'mind-map';
    if (parts[0] === 'hierarchy' && parts[1] === 'tree') prefix = 'hierarchy-tree';
  }
  prefixes.set(prefix, (prefixes.get(prefix) ?? 0) + 1);
}

console.log('\nBy prefix:');
for (const [k, v] of [...prefixes.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
