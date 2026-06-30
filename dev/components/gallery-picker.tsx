import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GALLERY_TEMPLATE_COUNT,
  fetchGallerySyntax,
  getGalleryCategories,
  renderGallerySvgFromSyntax,
} from 'svg-to-deck-converter';
import styles from './gallery-picker.module.css';

export interface GallerySelection {
  categoryId: string;
  slug: string;
}

export interface GalleryTemplatePayload {
  svg: string;
  syntax: string;
  selection: GallerySelection;
}

interface GalleryPickerProps {
  onTemplateLoaded: (payload: GalleryTemplatePayload) => void;
  onError: (message: string | null) => void;
}

const categories = getGalleryCategories();

export function GalleryPicker({ onTemplateLoaded, onError }: GalleryPickerProps) {
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

      setLoading(true);
      onError(null);

      try {
        const syntax = await fetchGallerySyntax(nextSlug);
        const svg = await renderGallerySvgFromSyntax(syntax);
        onTemplateLoaded({
          svg,
          syntax,
          selection: {
            categoryId: nextCategoryId,
            slug: nextSlug,
          },
        });
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    },
    [onError, onTemplateLoaded],
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
        {loading ? ' · 正在加载模板…' : ''}
      </p>
    </div>
  );
}
