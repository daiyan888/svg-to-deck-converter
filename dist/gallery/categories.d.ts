export interface GalleryCategory {
    id: string;
    label: string;
    templates: string[];
}
export declare function getCategoryId(slug: string): string;
export declare function getCategoryLabel(categoryId: string): string;
export declare function getGalleryCategories(): GalleryCategory[];
export declare function getGalleryTemplateUrl(slug: string): string;
export declare const GALLERY_TEMPLATE_COUNT: any;
//# sourceMappingURL=categories.d.ts.map