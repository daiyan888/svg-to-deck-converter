import { readFileSync } from 'node:fs';

const html = readFileSync('scripts/example-page.html', 'utf8');
const m = html.match(/<pre class="sr-only"[^>]*>([\s\S]*?)<\/pre>/);
console.log(m ? m[1].trim() : 'not found');
