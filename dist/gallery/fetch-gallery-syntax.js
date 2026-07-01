const GALLERY_ORIGIN = 'https://infographic.antv.vision';
function getGalleryPageUrl(slug) {
    return `${GALLERY_ORIGIN}/gallery/${slug}`;
}
export function extractSyntaxFromGalleryHtml(html) {
    const match = html.match(/<pre class="sr-only"[^>]*>([\s\S]*?)<\/pre>/);
    if (!match?.[1]) {
        throw new Error('未在 Gallery 页面中找到 syntax（pre.sr-only）');
    }
    return match[1].trim();
}
export async function fetchGallerySyntax(slug) {
    const response = await fetch(getGalleryPageUrl(slug));
    if (!response.ok) {
        throw new Error(`获取 Gallery 页面失败 (${response.status}): ${slug}`);
    }
    const html = await response.text();
    return extractSyntaxFromGalleryHtml(html);
}
