import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GALLERY_TEMPLATE_COUNT,
  getGalleryCategories,
  getGalleryTemplateUrl,
} from '../gallery/categories';
import { fetchGallerySyntax } from '../gallery/fetch-gallery-syntax';
import { renderGallerySvgFromSyntax } from '../gallery/render-gallery-svg';
import styles from './gallery-picker.module.css';

export interface GallerySelection {
  categoryId: string;
  slug: string;
  galleryUrl: string;
}

interface GalleryPickerProps {
  onSvgLoaded: (svg: string, selection: GallerySelection) => void;
  onGalleryUrlChange: (url: string) => void;
  onError: (message: string | null) => void;
}

const categories = getGalleryCategories();

export function GalleryPicker({
  onSvgLoaded,
  onGalleryUrlChange,
  onError,
}: GalleryPickerProps) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [slug, setSlug] = useState(categories[0]?.templates[0] ?? '');
  const [loading, setLoading] = useState(false);

  const currentCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? categories[0],
    [categoryId],
  );

  const templates = currentCategory?.templates ?? [];

  const loadTemplateSvg = useCallback(
    async (nextCategoryId: string, nextSlug: string) => {
      if (!nextSlug) {
        return;
      }

      const galleryUrl = getGalleryTemplateUrl(nextSlug);
      onGalleryUrlChange(galleryUrl);
      setLoading(true);
      onError(null);

      try {
        const syntax = await fetchGallerySyntax(nextSlug);
        const svg = await renderGallerySvgFromSyntax(syntax);
        onSvgLoaded(svg, {
          categoryId: nextCategoryId,
          slug: nextSlug,
          galleryUrl,
        });
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    },
    [onError, onGalleryUrlChange, onSvgLoaded],
  );

  const handleCategoryChange = useCallback(
    (nextCategoryId: string) => {
      const category = categories.find((item) => item.id === nextCategoryId);
      const nextSlug = category?.templates[0] ?? '';
      setCategoryId(nextCategoryId);
      setSlug(nextSlug);
      void loadTemplateSvg(nextCategoryId, nextSlug);
    },
    [loadTemplateSvg],
  );

  const handleTemplateChange = useCallback(
    (nextSlug: string) => {
      setSlug(nextSlug);
      void loadTemplateSvg(categoryId, nextSlug);
    },
    [categoryId, loadTemplateSvg],
  );

  useEffect(() => {
    if (categoryId && slug) {
      void loadTemplateSvg(categoryId, slug);
    }
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Gallery 类型</span>
          <select
            className={styles.select}
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={loading}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label} ({category.templates.length})
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>具体示例</span>
          <select
            className={styles.select}
            value={slug}
            onChange={(e) => handleTemplateChange(e.target.value)}
            disabled={loading || templates.length === 0}
          >
            {templates.map((templateSlug) => (
              <option key={templateSlug} value={templateSlug}>
                {templateSlug}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className={styles.meta}>
        共 {categories.length} 种类型 / {GALLERY_TEMPLATE_COUNT} 个官方示例
        {loading ? ' · 正在提取 SVG…' : ''}
      </p>
    </div>
  );
}
