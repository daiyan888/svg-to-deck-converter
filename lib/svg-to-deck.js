import e from "@tiptap/extension-paragraph";
import t from "@tiptap/extension-text";
import { Mark as n, Node as r, mergeAttributes as i } from "@tiptap/core";
import { NodeViewContent as a, NodeViewWrapper as o, ReactNodeViewRenderer as s } from "@tiptap/react";
import { jsx as c } from "react/jsx-runtime";
import l from "@tiptap/extension-document";
import { useMemo as u } from "react";
//#region src/converter/transform-utils.ts
function d(e) {
	let t = e.getAttribute("viewBox");
	if (t) {
		let e = t.trim().split(/[\s,]+/).map(Number);
		if (e.length === 4 && e.every((e) => !Number.isNaN(e))) return {
			minX: e[0],
			minY: e[1],
			width: e[2],
			height: e[3],
			viewBox: t.trim()
		};
	}
	let n = f(e.getAttribute("width"), 800), r = f(e.getAttribute("height"), 600);
	return {
		minX: 0,
		minY: 0,
		width: n,
		height: r,
		viewBox: `0 0 ${n} ${r}`
	};
}
function f(e, t) {
	if (!e) return t;
	let n = parseFloat(e);
	return Number.isNaN(n) ? t : n;
}
function p(e) {
	if (!e) return {
		tx: 0,
		ty: 0
	};
	let t = e.match(/translate\(\s*([+-]?(?:\d+\.?\d*|\.\d+))(?:[,\s]+([+-]?(?:\d+\.?\d*|\.\d+)))?\s*\)/);
	if (t) return {
		tx: parseFloat(t[1]),
		ty: parseFloat(t[2] ?? "0")
	};
	let n = e.match(/matrix\(\s*[^,]+,[^,]+,[^,]+,[^,]+,\s*([+-]?(?:\d+\.?\d*|\.\d+)),\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*\)/);
	return n ? {
		tx: parseFloat(n[1]),
		ty: parseFloat(n[2])
	} : {
		tx: 0,
		ty: 0
	};
}
function m(e) {
	if (!e) return 0;
	let t = parseFloat(e);
	return Number.isNaN(t) ? 0 : t;
}
function h(e) {
	let t = [], n = e;
	for (; n && n.tagName.toLowerCase() !== "svg";) t.push(n), n = n.parentElement;
	let r = 0, i = 0;
	for (let e of t.reverse()) {
		let t = e.tagName.toLowerCase(), n = e.getAttribute("transform");
		if (n) {
			let { tx: e, ty: t } = p(n);
			r += e, i += t;
			continue;
		}
		(t === "text" || t === "tspan" || t === "foreignobject") && (r += m(e.getAttribute("x")), i += m(e.getAttribute("y")));
	}
	return {
		x: r,
		y: i
	};
}
function g(e, t) {
	let n = RegExp(`(?:^|;)\\s*${t}\\s*:\\s*([^;]+)`, "i");
	return e.match(n)?.[1]?.trim();
}
//#endregion
//#region src/converter/attribute-utils.ts
var _ = {
	"accent-height": "accentHeight",
	"alignment-baseline": "alignmentBaseline",
	"arabic-form": "arabicForm",
	"baseline-shift": "baselineShift",
	"cap-height": "capHeight",
	"clip-path": "clipPath",
	"clip-rule": "clipRule",
	"color-interpolation": "colorInterpolation",
	"color-interpolation-filters": "colorInterpolationFilters",
	"color-profile": "colorProfile",
	"color-rendering": "colorRendering",
	"dominant-baseline": "dominantBaseline",
	"enable-background": "enableBackground",
	"fill-opacity": "fillOpacity",
	"fill-rule": "fillRule",
	"flood-color": "floodColor",
	"flood-opacity": "floodOpacity",
	"font-family": "fontFamily",
	"font-size": "fontSize",
	"font-size-adjust": "fontSizeAdjust",
	"font-stretch": "fontStretch",
	"font-style": "fontStyle",
	"font-variant": "fontVariant",
	"font-weight": "fontWeight",
	"glyph-orientation-horizontal": "glyphOrientationHorizontal",
	"glyph-orientation-vertical": "glyphOrientationVertical",
	"horiz-adv-x": "horizAdvX",
	"horiz-origin-x": "horizOriginX",
	"image-rendering": "imageRendering",
	"letter-spacing": "letterSpacing",
	"lighting-color": "lightingColor",
	"marker-end": "markerEnd",
	"marker-mid": "markerMid",
	"marker-start": "markerStart",
	"overline-position": "overlinePosition",
	"overline-thickness": "overlineThickness",
	"paint-order": "paintOrder",
	"panose-1": "panose1",
	"pointer-events": "pointerEvents",
	"rendering-intent": "renderingIntent",
	"shape-rendering": "shapeRendering",
	"stop-color": "stopColor",
	"stop-opacity": "stopOpacity",
	"strikethrough-position": "strikethroughPosition",
	"strikethrough-thickness": "strikethroughThickness",
	"stroke-dasharray": "strokeDasharray",
	"stroke-dashoffset": "strokeDashoffset",
	"stroke-linecap": "strokeLinecap",
	"stroke-linejoin": "strokeLinejoin",
	"stroke-miterlimit": "strokeMiterlimit",
	"stroke-opacity": "strokeOpacity",
	"stroke-width": "strokeWidth",
	"text-anchor": "textAnchor",
	"text-decoration": "textDecoration",
	"text-rendering": "textRendering",
	"transform-origin": "transformOrigin",
	"underline-position": "underlinePosition",
	"underline-thickness": "underlineThickness",
	"unicode-bidi": "unicodeBidi",
	"unicode-range": "unicodeRange",
	"units-per-em": "unitsPerEm",
	"v-alphabetic": "vAlphabetic",
	"v-hanging": "vHanging",
	"v-ideographic": "vIdeographic",
	"v-mathematical": "vMathematical",
	"vector-effect": "vectorEffect",
	"vert-adv-y": "vertAdvY",
	"vert-origin-x": "vertOriginX",
	"vert-origin-y": "vertOriginY",
	"word-spacing": "wordSpacing",
	"writing-mode": "writingMode",
	"x-height": "xHeight",
	"xlink:href": "xlinkHref",
	href: "href",
	class: "className"
};
function v(e) {
	return _[e] ? _[e] : e.includes("-") ? e.replace(/-([a-z])/g, (e, t) => t.toUpperCase()) : e;
}
function y(e) {
	if (e === "true") return !0;
	if (e === "false") return !1;
	let t = Number(e);
	return e.trim() !== "" && !Number.isNaN(t) && /^-?\d/.test(e.trim()) ? t : e;
}
function b(e) {
	let t = {};
	for (let n of Array.from(e.attributes)) n.name !== "style" && (t[v(n.name)] = y(n.value));
	let n = e.style;
	if (n && n.cssText) {
		let e = n.cssText.split(";");
		for (let n of e) {
			let e = n.indexOf(":");
			if (e <= 0) continue;
			let r = n.slice(0, e).trim(), i = n.slice(e + 1).trim();
			r && (t[v(r)] = y(i));
		}
	}
	return t;
}
function x(e, t) {
	if (typeof e == "number") return e;
	if (!e) return t;
	let n = parseFloat(String(e));
	return Number.isNaN(n) ? t : n;
}
//#endregion
//#region src/converter/color-utils.ts
var S = /* @__PURE__ */ new Set([
	"none",
	"transparent",
	"currentcolor"
]);
function C(e) {
	let t = e.search(/(?:linear|radial)-gradient\s*\(/i);
	if (t < 0) return null;
	let n = e.indexOf("(", t), r = 0;
	for (let i = n; i < e.length; i += 1) if (e[i] === "(") r += 1;
	else if (e[i] === ")" && (--r, r === 0)) return e.slice(t, i + 1);
	return null;
}
function w(e, t) {
	if (!e) return t;
	let n = e.trim();
	if (n.endsWith("%")) return n;
	let r = parseFloat(n);
	return Number.isNaN(r) ? t : r <= 1 && !n.includes("%") ? `${r * 100}%` : `${r}%`;
}
function T(e, t, n) {
	if (!e) return n <= 1 ? "0%" : `${t / (n - 1) * 100}%`;
	let r = e.trim();
	if (r.endsWith("%")) return r;
	let i = parseFloat(r);
	return Number.isNaN(i) ? "0%" : i <= 1 ? `${i * 100}%` : `${i}%`;
}
function E(e) {
	let t = e.style?.getPropertyValue("stop-color");
	return e.getAttribute("stop-color") ?? t ?? "#000000";
}
function ee(e, t, n, r) {
	let i = parseFloat(e), a = parseFloat(t), o = parseFloat(n), s = parseFloat(r);
	if (Math.abs(a - s) < .001) return o >= i ? "to right" : "to left";
	if (Math.abs(i - o) < .001) return s >= a ? "to bottom" : "to top";
	let c = Math.atan2(o - i, a - s) * 180 / Math.PI;
	return `${Math.round(c)}deg`;
}
function te(e) {
	let t = Array.from(e.querySelectorAll("stop"));
	if (t.length === 0) return null;
	let n = t.map((e, n) => {
		let r = T(e.getAttribute("offset"), n, t.length);
		return `${E(e)} ${r}`;
	});
	return `linear-gradient(${ee(w(e.getAttribute("x1"), "0%"), w(e.getAttribute("y1"), "0%"), w(e.getAttribute("x2"), "100%"), w(e.getAttribute("y2"), "0%"))}, ${n.join(", ")})`;
}
function D(e) {
	let t = Array.from(e.querySelectorAll("stop"));
	if (t.length === 0) return null;
	let n = t.map((e, n) => {
		let r = T(e.getAttribute("offset"), n, t.length);
		return `${E(e)} ${r}`;
	}), r = w(e.getAttribute("cx"), "50%"), i = w(e.getAttribute("cy"), "50%");
	return `radial-gradient(circle ${w(e.getAttribute("r"), "50%")} at ${r} ${i}, ${n.join(", ")})`;
}
function O(e, t) {
	let n = e.match(/^url\(\s*#([^)]+)\s*\)$/i);
	if (!n) return null;
	let r = t.querySelector(`#${CSS.escape(n[1])}`) ?? t.ownerDocument?.getElementById(n[1]);
	if (!r) return null;
	let i = r.tagName.toLowerCase();
	return i === "lineargradient" ? te(r) : i === "radialgradient" ? D(r) : null;
}
function k(e) {
	let t = e.trim().toLowerCase();
	return !t || S.has(t) ? !1 : !t.startsWith("url(");
}
function A(e) {
	if ((g(e, "-webkit-background-clip") ?? g(e, "background-clip"))?.toLowerCase() !== "text") return;
	let t = g(e, "background-image") ?? g(e, "background");
	if (t) return C(t) ?? void 0;
}
function j(e) {
	let t = g(e, "color");
	if (!(!t || t.toLowerCase() === "transparent")) return t;
}
function ne(e) {
	let t = A(e);
	if (t) return { textGradientColor: t };
	let n = j(e);
	return n ? { color: n } : {};
}
function re(e, t) {
	if (!e) return {};
	let n = e.trim();
	if (n.toLowerCase().startsWith("url(")) {
		let e = O(n, t);
		return e ? { textGradientColor: e } : {};
	}
	return k(n) ? { color: n } : {};
}
function M(e) {
	if (e.style) {
		let t = ne(e.style);
		if (t.color || t.textGradientColor) return t;
	}
	return e.fill && e.svgRoot ? re(e.fill, e.svgRoot) : e.fill && k(e.fill) ? { color: e.fill.trim() } : {};
}
//#endregion
//#region src/converter/svg-tags.ts
var ie = /* @__PURE__ */ new Set([
	"g",
	"animate",
	"ellipse",
	"circle",
	"polygon",
	"rect",
	"path",
	"linearGradient",
	"stop"
]), ae = /* @__PURE__ */ new Set([
	"defs",
	"clipPath",
	"mask",
	"line",
	"polyline",
	"radialGradient",
	"use",
	"image",
	"pattern",
	"symbol",
	"marker",
	"foreignObject"
]);
function oe(e) {
	let t = e.toLowerCase();
	for (let e of ie) if (e.toLowerCase() === t) return e;
	for (let e of ae) if (e.toLowerCase() === t) return e;
}
function se(e, t) {
	return oe(e) || (t ? "g" : "path");
}
function N(e) {
	let t = e.toLowerCase();
	return t === "text" || t === "tspan";
}
function P(e) {
	let t = e.toLowerCase();
	return t === "svg" || t === "style" || t === "script" || t === "title" || t === "desc";
}
//#endregion
//#region src/converter/text-extractor.ts
function F(e) {
	let t = "";
	for (let n of Array.from(e.childNodes)) n.nodeType === Node.TEXT_NODE && (t += n.textContent ?? "");
	return t.trim();
}
function I(e, t) {
	let n = e.getAttribute(t);
	if (!n) return;
	let r = parseFloat(n);
	return Number.isNaN(r) ? void 0 : r;
}
function L(e) {
	let t = I(e, "width") ?? I(e, "data-width"), n = I(e, "height") ?? I(e, "data-height"), r = e.parentElement;
	return r?.tagName.toLowerCase() === "g" ? {
		width: t ?? I(r, "width"),
		height: n ?? I(r, "height")
	} : {
		width: t,
		height: n
	};
}
function R(e, t) {
	return {
		width: Math.max(Math.ceil(e.length * t * .65), t),
		height: Math.ceil(t * 1.2)
	};
}
function z(e, t, n, r, i, a) {
	let o = e, s = t;
	return i === "middle" ? o = e - n / 2 : i === "end" && (o = e - n), s = a === "central" || a === "middle" ? t - r / 2 : a === "hanging" || a === "text-before-edge" ? t : t - r * .85, {
		left: o,
		top: s
	};
}
function B(e, t) {
	let n = e.getAttribute("data-horizontal-align")?.toLowerCase();
	if (n === "right") return "right";
	if (n === "center" || n === "middle") return "center";
	if (n === "left") return "left";
	let r = g(t, "text-align");
	if (r === "right") return "right";
	if (r === "center") return "center";
	if (r === "left") return "left";
}
function V(e, t) {
	return !e && !t ? null : {
		type: "textGradientColor",
		attrs: {
			color: e ?? null,
			textGradientColor: t ?? null
		}
	};
}
function H(e, t, n, r, i, a) {
	let o = [{
		type: "textStyle",
		attrs: {
			fontFamily: t,
			fontSize: n
		}
	}], s = V(i, a);
	s && o.push(s);
	let c = {
		type: "text",
		text: e,
		marks: o
	};
	return {
		type: "multiBlockContain",
		content: [{
			type: "paragraph",
			...r ? { attrs: { textAlign: r } } : {},
			content: [c]
		}]
	};
}
function U(e, t, n) {
	return {
		left: e - n.minX,
		top: t - n.minY
	};
}
function W(e, t, n, r, i) {
	let a = F(e);
	if (!a) return null;
	let o = b(e), s = typeof o.fontFamily == "string" ? o.fontFamily : t, c = x(typeof o.fontSize == "string" || typeof o.fontSize == "number" ? o.fontSize : void 0, n), l = L(e), { width: u, height: d } = l.width && l.height ? {
		width: l.width,
		height: l.height
	} : R(a, c), f = h(e), p = typeof o.textAnchor == "string" ? o.textAnchor : void 0, m = typeof o.dominantBaseline == "string" ? o.dominantBaseline : void 0, g = z(f.x, f.y, u, d, p, m), { left: _, top: v } = U(g.left, g.top, r), { color: y, textGradientColor: S } = M({
		fill: typeof o.fill == "string" ? o.fill : void 0,
		svgRoot: i
	});
	return {
		left: _,
		top: v,
		width: u,
		height: d,
		multiBlockContain: H(a, s, c, void 0, y, S)
	};
}
function G(e, t, n, r, i) {
	let a = e.querySelector("span"), o = (a?.textContent ?? e.textContent ?? "").trim();
	if (!o) return null;
	let s = a?.getAttribute("style") ?? "", c = x(g(s, "font-size"), n), l = g(s, "font-family") ?? t, u = B(e, s), d = I(e, "width") ?? R(o, c).width, f = I(e, "height") ?? R(o, c).height, p = h(e), { left: m, top: _ } = U(p.x, p.y, r), { color: v, textGradientColor: y } = M({
		style: s,
		svgRoot: i
	});
	return {
		left: m,
		top: _,
		width: d,
		height: f,
		multiBlockContain: H(o, l, c, u, v, y)
	};
}
function K(e, t, n, r, i, a, o) {
	if (e.tagName.toLowerCase() === "foreignobject") {
		let s = G(e, n, r, i, a);
		s && (t.push(s), o.textNodeCount += 1);
		return;
	}
	if (N(e.tagName)) {
		let s = W(e, n, r, i, a);
		s && (t.push(s), o.textNodeCount += 1);
		return;
	}
	for (let s of Array.from(e.children)) K(s, t, n, r, i, a, o);
}
function q(e, t, n, r, i) {
	let a = [];
	return K(e, a, n, r, t, e, i), a;
}
function ce(e, t, n, r) {
	return q(e, {
		minX: 0,
		minY: 0,
		width: 800,
		height: 600,
		viewBox: "0 0 800 600"
	}, t, n, r).map((e) => e.multiBlockContain);
}
//#endregion
//#region src/converter/svg-to-commands.ts
function J(e) {
	return Array.from(e.childNodes).filter((e) => e.nodeType === Node.ELEMENT_NODE);
}
function Y(e, t) {
	let n = e.tagName.toLowerCase();
	if (P(n) || N(n) || t.skipForeignObject && n === "foreignobject") return null;
	let r = J(e).filter((e) => !N(e.tagName)), i = se(n, r.length > 0), a = b(e);
	i === "path" && n !== "path" && !a.d && t.skippedNodes.push(`<${n}> → 无 d 属性，已映射为 path`);
	let o = [];
	for (let e of r) {
		let n = Y(e, t);
		n && (o.push(n), t.commandCount += 1);
	}
	return t.commandCount += 1, {
		comp: i,
		props: a,
		...o.length > 0 ? { children: o } : {}
	};
}
function X(e, t) {
	let n = [];
	for (let r of J(e)) {
		if (N(r.tagName)) continue;
		let e = Y(r, t);
		e && n.push(e);
	}
	return n;
}
//#endregion
//#region src/converter/svg-to-deck.ts
var le = {
	offsetTop: 0,
	offsetLeft: 0,
	extractText: !0,
	defaultFontSize: 14,
	defaultFontFamily: "sans-serif"
};
function ue(e) {
	return e.querySelector("svg");
}
function de(e, t = {}) {
	let n = {
		...le,
		...t
	}, r = new DOMParser().parseFromString(e, "image/svg+xml"), i = r.querySelector("parsererror");
	if (i) throw Error(`SVG 解析失败: ${i.textContent ?? "未知错误"}`);
	let a = ue(r);
	if (!a) throw Error("未找到 <svg> 根元素");
	let o = d(a), s = {
		skippedNodes: [],
		commandCount: 0,
		skipForeignObject: n.extractText
	}, c = { textNodeCount: 0 }, l = X(a, s), u = {
		type: "svg",
		attrs: {
			width: o.width,
			height: o.height,
			viewBox: o.viewBox,
			commands: l
		}
	}, f = [{
		type: "deckNode",
		attrs: {
			width: o.width,
			height: o.height,
			top: n.offsetTop,
			left: n.offsetLeft
		},
		content: [u]
	}];
	if (n.extractText) {
		let e = q(a, o, n.defaultFontFamily, n.defaultFontSize, c);
		for (let t of e) f.push({
			type: "deckNode",
			attrs: {
				width: t.width,
				height: t.height,
				top: t.top,
				left: t.left
			},
			content: [t.multiBlockContain]
		});
	}
	return {
		document: {
			type: "deck",
			content: f
		},
		stats: {
			commandCount: s.commandCount,
			textNodeCount: c.textNodeCount,
			skippedNodes: s.skippedNodes
		}
	};
}
function fe(e) {
	let t = new DOMParser().parseFromString(e, "text/html").querySelector("svg");
	return t ? t.outerHTML : null;
}
//#endregion
//#region src/tiptap/extensions/deck.tsx
function pe(e) {
	let t = 400, n = 300;
	return e.forEach((e) => {
		e.type.name === "deckNode" && (t = Math.max(t, e.attrs.left + e.attrs.width), n = Math.max(n, e.attrs.top + e.attrs.height));
	}), {
		width: t,
		height: n
	};
}
function me({ node: e }) {
	let { width: t, height: n } = pe(e);
	return /* @__PURE__ */ c(o, {
		as: "div",
		"data-deck": "",
		style: {
			position: "relative",
			width: t,
			height: n,
			overflow: "hidden",
			border: "1px dashed #d9d9d9",
			background: "#fafafa",
			boxSizing: "border-box"
		},
		children: /* @__PURE__ */ c(a, {})
	});
}
var he = r.create({
	name: "deck",
	group: "block",
	content: "deckNode+",
	defining: !0,
	parseHTML() {
		return [{ tag: "div[data-deck]" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"div",
			i(e, { "data-deck": "" }),
			0
		];
	},
	addNodeView() {
		return s(me);
	}
}), ge = l.extend({ content: "deck" });
//#endregion
//#region src/tiptap/extensions/deck-node.tsx
function _e({ node: e }) {
	let { width: t, height: n, top: r, left: i } = e.attrs;
	return /* @__PURE__ */ c(o, {
		as: "div",
		"data-deck-node": "",
		style: {
			position: "absolute",
			boxSizing: "border-box",
			width: t,
			height: n,
			top: r,
			left: i
		},
		children: /* @__PURE__ */ c(a, {})
	});
}
var ve = r.create({
	name: "deckNode",
	group: "block",
	content: "(svg|multiBlockContain)",
	defining: !0,
	addAttributes() {
		return {
			width: { default: 0 },
			height: { default: 0 },
			top: { default: 0 },
			left: { default: 0 }
		};
	},
	parseHTML() {
		return [{ tag: "div[data-deck-node]" }];
	},
	renderHTML({ node: e, HTMLAttributes: t }) {
		let { width: n, height: r, top: a, left: o } = e.attrs;
		return [
			"div",
			i(t, {
				"data-deck-node": "",
				style: `position:absolute;box-sizing:border-box;width:${n}px;height:${r}px;top:${a}px;left:${o}px;`
			}),
			0
		];
	},
	addNodeView() {
		return s(_e);
	}
}), ye = n.create({
	name: "textStyle",
	addAttributes() {
		return {
			fontFamily: {
				default: "sans-serif",
				parseHTML: (e) => e.style.fontFamily || "sans-serif",
				renderHTML: (e) => ({ fontFamily: e.fontFamily })
			},
			fontSize: {
				default: 14,
				parseHTML: (e) => {
					let t = e.style.fontSize;
					return t ? parseFloat(t) : 14;
				},
				renderHTML: (e) => ({ fontSize: e.fontSize })
			}
		};
	},
	parseHTML() {
		return [{ tag: "span[data-text-style]" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		let { fontFamily: t, fontSize: n } = e;
		return [
			"span",
			i(e, {
				"data-text-style": "",
				style: `font-family:${t};font-size:${n}px;`
			}),
			0
		];
	}
});
//#endregion
//#region src/tiptap/text-color-style.ts
function be(e) {
	let { color: t, textGradientColor: n } = e;
	if (n) return {
		background: n,
		WebkitBackgroundClip: "text",
		backgroundClip: "text",
		WebkitTextFillColor: "transparent",
		color: "transparent"
	};
	if (t) return { color: t };
}
function xe(e) {
	let t = be(e);
	return t ? Object.entries(t).map(([e, t]) => `${e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}:${t}`).join(";") : "";
}
//#endregion
//#region src/tiptap/extensions/text-gradient-color.ts
var Se = n.create({
	name: "textGradientColor",
	addAttributes() {
		return {
			color: {
				default: null,
				parseHTML: (e) => e.style.color || null,
				renderHTML: (e) => e.color ? { color: e.color } : {}
			},
			textGradientColor: {
				default: null,
				parseHTML: (e) => e.getAttribute("data-text-gradient") || null,
				renderHTML: (e) => e.textGradientColor ? { "data-text-gradient": e.textGradientColor } : {}
			}
		};
	},
	parseHTML() {
		return [{ tag: "span[data-text-gradient-color]" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		let { color: t, textGradientColor: n, ...r } = e, a = xe({
			color: t,
			textGradientColor: n
		});
		return [
			"span",
			i(r, {
				"data-text-gradient-color": "",
				...n ? { "data-text-gradient": n } : {},
				...a ? { style: a } : {}
			}),
			0
		];
	}
});
//#endregion
//#region src/tiptap/extensions/multi-block-contain.tsx
function Z() {
	return /* @__PURE__ */ c(o, {
		as: "div",
		style: {
			width: "100%",
			height: "100%",
			margin: 0,
			whiteSpace: "pre-wrap",
			pointerEvents: "none"
		},
		children: /* @__PURE__ */ c(a, {})
	});
}
var Ce = r.create({
	name: "multiBlockContain",
	group: "block",
	content: "paragraph+",
	defining: !0,
	parseHTML() {
		return [{ tag: "div[data-multi-block-contain]" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"div",
			i(e, {
				"data-multi-block-contain": "",
				style: "white-space:pre-wrap;"
			}),
			0
		];
	},
	addNodeView() {
		return s(Z);
	}
}), we = /* @__PURE__ */ new Set([
	"path",
	"rect",
	"circle",
	"ellipse",
	"line",
	"polyline",
	"polygon",
	"stop",
	"use",
	"image"
]), Q = {
	className: "class",
	fillOpacity: "fill-opacity",
	fillRule: "fill-rule",
	strokeOpacity: "stroke-opacity",
	strokeWidth: "stroke-width",
	strokeLinecap: "stroke-linecap",
	strokeLinejoin: "stroke-linejoin",
	strokeDasharray: "stroke-dasharray",
	strokeDashoffset: "stroke-dashoffset",
	clipPath: "clip-path",
	clipRule: "clip-rule",
	fontFamily: "font-family",
	fontSize: "font-size",
	fontWeight: "font-weight",
	textAnchor: "text-anchor",
	dominantBaseline: "dominant-baseline",
	xlinkHref: "xlink:href",
	stopColor: "stop-color",
	stopOpacity: "stop-opacity"
};
function Te(e) {
	return e.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function Ee(e) {
	return Q[e] ? Q[e] : !e.includes("-") && /[A-Z]/.test(e) ? e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`) : e;
}
function De(e) {
	return Object.entries(e).filter(([e]) => e !== "key").map(([e, t]) => `${Ee(e)}="${Te(String(t))}"`).join(" ");
}
function $(e) {
	let { comp: t, props: n, children: r } = e, i = De(n), a = i ? `<${t} ${i}` : `<${t}`;
	return r?.length ? `${a}>${r.map($).join("")}</${t}>` : we.has(t) ? `${a} />` : `${a}></${t}>`;
}
function Oe(e) {
	return e.map($).join("");
}
//#endregion
//#region src/renderer/svg-from-commands.tsx
var ke = "http://www.w3.org/2000/svg";
function Ae({ width: e, height: t, viewBox: n, commands: r, className: i, style: a }) {
	let o = u(() => Oe(r), [r]);
	return /* @__PURE__ */ c("svg", {
		xmlns: ke,
		width: e,
		height: t,
		viewBox: n ?? `0 0 ${e} ${t}`,
		className: i,
		style: a,
		dangerouslySetInnerHTML: { __html: o }
	});
}
//#endregion
//#region src/tiptap/extensions/svg-node.tsx
function je({ node: e }) {
	let { width: t, height: n, viewBox: r, commands: i } = e.attrs;
	return /* @__PURE__ */ c(o, {
		as: "div",
		style: {
			position: "absolute",
			top: 0,
			left: 0,
			width: t,
			height: n,
			pointerEvents: "none"
		},
		children: /* @__PURE__ */ c(Ae, {
			width: t,
			height: n,
			viewBox: r,
			commands: i
		})
	});
}
var Me = [
	ge,
	he,
	ve,
	r.create({
		name: "svg",
		group: "block",
		atom: !0,
		draggable: !1,
		addAttributes() {
			return {
				width: { default: 0 },
				height: { default: 0 },
				viewBox: { default: null },
				commands: {
					default: [],
					parseHTML: (e) => {
						let t = e.getAttribute("data-commands");
						if (!t) return [];
						try {
							return JSON.parse(t);
						} catch {
							return [];
						}
					},
					renderHTML: (e) => {
						let t = e.commands;
						return t?.length ? { "data-commands": JSON.stringify(t) } : {};
					}
				}
			};
		},
		parseHTML() {
			return [{ tag: "div[data-svg-node]" }];
		},
		renderHTML({ node: e, HTMLAttributes: t }) {
			let { width: n, height: r } = e.attrs;
			return ["div", i(t, {
				"data-svg-node": "",
				style: `position:absolute;top:0;left:0;width:${n}px;height:${r}px;`
			})];
		},
		addNodeView() {
			return s(je);
		}
	}),
	Ce,
	e.extend({
		addAttributes() {
			return { textAlign: {
				default: null,
				parseHTML: (e) => e.style.textAlign || null,
				renderHTML: (e) => e.textAlign ? { style: `text-align: ${e.textAlign}` } : {}
			} };
		},
		renderHTML({ node: e, HTMLAttributes: t }) {
			let n = e.attrs.textAlign, r = n ? `text-align:${n};` : "";
			return [
				"p",
				{
					...t,
					style: `margin:0;line-height:1.2;${r}`
				},
				0
			];
		}
	}),
	t,
	ye,
	Se
];
//#endregion
export { de as convertSvgToDeck, Me as deckExtensions, fe as extractSvgFromHtml, ce as extractTextBlocks, q as extractTextDeckNodes, X as svgElementToCommands };
