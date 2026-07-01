export function parseViewBox(svg) {
    const viewBoxAttr = svg.getAttribute('viewBox');
    if (viewBoxAttr) {
        const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
            return {
                minX: parts[0],
                minY: parts[1],
                width: parts[2],
                height: parts[3],
                viewBox: viewBoxAttr.trim(),
            };
        }
    }
    const width = parseSvgLength(svg.getAttribute('width'), 800);
    const height = parseSvgLength(svg.getAttribute('height'), 600);
    return {
        minX: 0,
        minY: 0,
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    };
}
function parseSvgLength(value, fallback) {
    if (!value) {
        return fallback;
    }
    const num = parseFloat(value);
    return Number.isNaN(num) ? fallback : num;
}
export function parseTransform(transform) {
    if (!transform) {
        return { tx: 0, ty: 0 };
    }
    const translateMatch = transform.match(/translate\(\s*([+-]?(?:\d+\.?\d*|\.\d+))(?:[,\s]+([+-]?(?:\d+\.?\d*|\.\d+)))?\s*\)/);
    if (translateMatch) {
        return {
            tx: parseFloat(translateMatch[1]),
            ty: parseFloat(translateMatch[2] ?? '0'),
        };
    }
    const matrixMatch = transform.match(/matrix\(\s*[^,]+,[^,]+,[^,]+,[^,]+,\s*([+-]?(?:\d+\.?\d*|\.\d+)),\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*\)/);
    if (matrixMatch) {
        return {
            tx: parseFloat(matrixMatch[1]),
            ty: parseFloat(matrixMatch[2]),
        };
    }
    return { tx: 0, ty: 0 };
}
function parseNum(value) {
    if (!value) {
        return 0;
    }
    const n = parseFloat(value);
    return Number.isNaN(n) ? 0 : n;
}
/** 从元素到 svg 根，累加 transform / x / y 得到 SVG 用户坐标系下的锚点 */
export function getAbsoluteAnchor(el) {
    const chain = [];
    let current = el;
    while (current) {
        const tag = current.tagName.toLowerCase();
        if (tag === 'svg') {
            break;
        }
        chain.push(current);
        current = current.parentElement;
    }
    let x = 0;
    let y = 0;
    for (const node of chain.reverse()) {
        const tag = node.tagName.toLowerCase();
        const transform = node.getAttribute('transform');
        if (transform) {
            const { tx, ty } = parseTransform(transform);
            x += tx;
            y += ty;
            continue;
        }
        if (tag === 'text' || tag === 'tspan' || tag === 'foreignobject') {
            x += parseNum(node.getAttribute('x'));
            y += parseNum(node.getAttribute('y'));
        }
    }
    return { x, y };
}
export function parseStyleValue(style, prop) {
    const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i');
    const match = style.match(re);
    return match?.[1]?.trim();
}
