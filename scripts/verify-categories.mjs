import { getGalleryCategories, GALLERY_TEMPLATE_COUNT } from '../src/gallery/categories.ts';

const categories = getGalleryCategories();
console.log('Categories:', categories.length);
console.log('Templates:', GALLERY_TEMPLATE_COUNT);
console.log(
  categories.map((c) => `${c.label}: ${c.templates.length}`).join('\n'),
);
