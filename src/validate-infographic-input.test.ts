import { describe, expect, it } from 'vitest';
import {
  validateInfographicData,
  validateInfographicInput,
  validateInfographicSyntax,
} from './validate-infographic-input.js';

const sampleData = {
  title: '年度营收增长',
  desc: '展示近三年及本年目标营收对比（单位：亿元）',
  values: [
    { label: '2021年', value: 120, desc: '转型初期', icon: 'lucide/sprout' },
    { label: '2022年', value: 150, desc: '平台优化', icon: 'lucide/zap' },
    { label: '2023年', value: 190, desc: '全面增长', icon: 'lucide/brain-circuit' },
    { label: '2024年', value: 240, desc: '冲击新高', icon: 'lucide/trophy' },
  ],
};

const sampleSyntax = `
infographic chart-bar-plain-text
data
  title 年度营收增长
  desc 展示近三年及本年目标营收对比（单位：亿元）
  values
    - label 2021年
      value 120
      desc 转型初期
      icon lucide/sprout
    - label 2022年
      value 150
      desc 平台优化
      icon lucide/zap
theme light
  palette #2563EB #7C3AED #DB2777
`.trim();

describe('validateInfographicData', () => {
  it('accepts the README sample data', () => {
    const result = validateInfographicData(sampleData);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects null / non-object data', () => {
    expect(validateInfographicData(null).valid).toBe(false);
    expect(validateInfographicData('x').errors[0]?.code).toBe('invalid_type');
  });

  it('requires a non-empty collection', () => {
    const result = validateInfographicData({ title: 'only title' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'missing_field')).toBe(true);
  });

  it('rejects empty values array', () => {
    const result = validateInfographicData({ values: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'values')).toBe(true);
  });

  it('rejects invalid item field types', () => {
    const result = validateInfographicData({
      values: [{ label: 1, value: {}, icon: 3 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.path)).toEqual(
      expect.arrayContaining(['values[0].label', 'values[0].value', 'values[0].icon']),
    );
  });

  it('accepts string values and nested children', () => {
    const result = validateInfographicData({
      items: [
        {
          label: 'root',
          children: [{ label: 'child', value: '10%' }],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('validates relations.from / relations.to', () => {
    const result = validateInfographicData({
      relations: [{ from: '', to: 'b' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'relations[0].from')).toBe(true);
  });
});

describe('validateInfographicSyntax', () => {
  it('accepts the README sample syntax', () => {
    const result = validateInfographicSyntax(sampleSyntax);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects empty / non-string syntax', () => {
    expect(validateInfographicSyntax('').valid).toBe(false);
    expect(validateInfographicSyntax('   ').errors[0]?.code).toBe('empty');
    expect(validateInfographicSyntax(123).errors[0]?.code).toBe('invalid_type');
  });

  it('rejects unknown top-level keys from parseSyntax', () => {
    const result = validateInfographicSyntax('not valid');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'syntax_error')).toBe(true);
  });

  it('requires template and data blocks', () => {
    const noTemplate = validateInfographicSyntax(`
data
  title hello
  values
    - label a
      value 1
`.trim());
    expect(noTemplate.valid).toBe(false);
    expect(noTemplate.errors.some((e) => e.path === 'template')).toBe(true);

    const noData = validateInfographicSyntax('infographic chart-bar-plain-text');
    expect(noData.valid).toBe(false);
    expect(noData.errors.some((e) => e.path === 'data')).toBe(true);
  });
});

describe('validateInfographicInput', () => {
  it('routes data and syntax correctly', () => {
    expect(validateInfographicInput({ data: sampleData }).valid).toBe(true);
    expect(validateInfographicInput({ syntax: sampleSyntax }).valid).toBe(true);
  });

  it('rejects when both or neither are provided', () => {
    expect(validateInfographicInput({} as never).valid).toBe(false);
    expect(
      validateInfographicInput({ data: sampleData, syntax: sampleSyntax } as never).valid,
    ).toBe(false);
  });
});
