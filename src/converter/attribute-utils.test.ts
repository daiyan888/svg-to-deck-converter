import { describe, expect, it } from 'vitest';
import { svgAttrNameFromCamel } from './attribute-utils.js';

describe('svgAttrNameFromCamel', () => {
  it('kebabs presentation attributes', () => {
    expect(svgAttrNameFromCamel('strokeWidth')).toBe('stroke-width');
    expect(svgAttrNameFromCamel('strokeDasharray')).toBe('stroke-dasharray');
    expect(svgAttrNameFromCamel('strokeDashoffset')).toBe('stroke-dashoffset');
    expect(svgAttrNameFromCamel('fillOpacity')).toBe('fill-opacity');
    expect(svgAttrNameFromCamel('className')).toBe('class');
    expect(svgAttrNameFromCamel('xlinkHref')).toBe('xlink:href');
  });

  it('preserves SVG/SMIL camelCase attributes', () => {
    expect(svgAttrNameFromCamel('maskUnits')).toBe('maskUnits');
    expect(svgAttrNameFromCamel('maskContentUnits')).toBe('maskContentUnits');
    expect(svgAttrNameFromCamel('gradientUnits')).toBe('gradientUnits');
    expect(svgAttrNameFromCamel('gradientTransform')).toBe('gradientTransform');
    expect(svgAttrNameFromCamel('attributeName')).toBe('attributeName');
    expect(svgAttrNameFromCamel('attributeType')).toBe('attributeType');
    expect(svgAttrNameFromCamel('repeatCount')).toBe('repeatCount');
    expect(svgAttrNameFromCamel('spreadMethod')).toBe('spreadMethod');
    expect(svgAttrNameFromCamel('stdDeviation')).toBe('stdDeviation');
    expect(svgAttrNameFromCamel('viewBox')).toBe('viewBox');
    expect(svgAttrNameFromCamel('preserveAspectRatio')).toBe('preserveAspectRatio');
  });

  it('leaves already-kebab and simple names unchanged', () => {
    expect(svgAttrNameFromCamel('stroke')).toBe('stroke');
    expect(svgAttrNameFromCamel('d')).toBe('d');
    expect(svgAttrNameFromCamel('stroke-width')).toBe('stroke-width');
  });
});
