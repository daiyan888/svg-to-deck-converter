import { parseSyntax, type SyntaxError } from '@antv/infographic';

export type ValidationIssueCode =
  | 'empty'
  | 'invalid_type'
  | 'missing_field'
  | 'invalid_value'
  | 'empty_collection'
  | 'syntax_error';

export interface ValidationIssue {
  /** 出错字段路径，如 `data.values[0].value` */
  path: string;
  /** 可读错误信息 */
  message: string;
  code: ValidationIssueCode;
  /** Syntax 解析时的行号（1-based） */
  line?: number;
}

export interface ValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export type ValidateInfographicInputArg =
  | { data: unknown; syntax?: undefined }
  | { syntax: unknown; data?: undefined };

const COLLECTION_KEYS = [
  'values',
  'items',
  'lists',
  'sequences',
  'compares',
  'nodes',
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pushError(
  errors: ValidationIssue[],
  path: string,
  message: string,
  code: ValidationIssueCode,
  line?: number,
): void {
  errors.push(line === undefined ? { path, message, code } : { path, message, code, line });
}

function validateOptionalString(
  errors: ValidationIssue[],
  parentPath: string,
  key: string,
  value: unknown,
): void {
  if (value === undefined) return;
  if (typeof value !== 'string') {
    pushError(
      errors,
      parentPath ? `${parentPath}.${key}` : key,
      `${key} 必须是字符串`,
      'invalid_type',
    );
  }
}

function validateOptionalIcon(
  errors: ValidationIssue[],
  path: string,
  value: unknown,
): void {
  if (value === undefined) return;
  if (typeof value === 'string') return;
  if (isPlainObject(value)) return;
  pushError(errors, path, 'icon 必须是字符串或资源对象', 'invalid_type');
}

function validateOptionalValue(
  errors: ValidationIssue[],
  path: string,
  value: unknown,
): void {
  if (value === undefined) return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      pushError(errors, path, 'value 必须是有限数字', 'invalid_value');
    }
    return;
  }
  if (typeof value === 'string') {
    if (value.trim() === '') {
      pushError(errors, path, 'value 不能为空字符串', 'invalid_value');
    }
    return;
  }
  pushError(errors, path, 'value 必须是数字或字符串', 'invalid_type');
}

function validateDatum(
  errors: ValidationIssue[],
  path: string,
  value: unknown,
): void {
  if (!isPlainObject(value)) {
    pushError(errors, path, '数据项必须是对象', 'invalid_type');
    return;
  }

  validateOptionalString(errors, path, 'label', value.label);
  validateOptionalString(errors, path, 'desc', value.desc);
  validateOptionalString(errors, path, 'id', value.id);
  validateOptionalString(errors, path, 'group', value.group);
  validateOptionalString(errors, path, 'category', value.category);
  validateOptionalValue(errors, `${path}.value`, value.value);
  validateOptionalIcon(errors, `${path}.icon`, value.icon);
  validateOptionalIcon(errors, `${path}.illus`, value.illus);

  if (value.children !== undefined) {
    if (!Array.isArray(value.children)) {
      pushError(errors, `${path}.children`, 'children 必须是数组', 'invalid_type');
    } else {
      value.children.forEach((child, index) => {
        validateDatum(errors, `${path}.children[${index}]`, child);
      });
    }
  }
}

function validateRelation(
  errors: ValidationIssue[],
  path: string,
  value: unknown,
): void {
  if (!isPlainObject(value)) {
    pushError(errors, path, 'relation 必须是对象', 'invalid_type');
    return;
  }

  if (typeof value.from !== 'string' || value.from.trim() === '') {
    pushError(errors, `${path}.from`, 'from 必须是非空字符串', 'invalid_value');
  }
  if (typeof value.to !== 'string' || value.to.trim() === '') {
    pushError(errors, `${path}.to`, 'to 必须是非空字符串', 'invalid_value');
  }

  validateOptionalString(errors, path, 'label', value.label);
  validateOptionalString(errors, path, 'id', value.id);
  validateOptionalValue(errors, `${path}.value`, value.value);
}

function hasNonEmptyCollection(data: Record<string, unknown>): boolean {
  for (const key of COLLECTION_KEYS) {
    const value = data[key];
    if (Array.isArray(value) && value.length > 0) return true;
  }
  if (isPlainObject(data.root)) return true;
  if (Array.isArray(data.relations) && data.relations.length > 0) return true;
  return false;
}

/**
 * 校验 Infographic `data` 对象结构（与 `convertInfographicToDeck` 的 data 入参一致）。
 */
export function validateInfographicData(data: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (data === undefined || data === null) {
    pushError(errors, 'data', 'data 不能为空', 'empty');
    return { valid: false, errors, warnings };
  }

  if (!isPlainObject(data)) {
    pushError(errors, 'data', 'data 必须是对象', 'invalid_type');
    return { valid: false, errors, warnings };
  }

  validateOptionalString(errors, '', 'title', data.title);
  validateOptionalString(errors, '', 'desc', data.desc);

  for (const key of COLLECTION_KEYS) {
    const value = data[key];
    if (value === undefined) continue;
    if (!Array.isArray(value)) {
      pushError(errors, key, `${key} 必须是数组`, 'invalid_type');
      continue;
    }
    if (value.length === 0) {
      pushError(errors, key, `${key} 不能为空数组`, 'empty_collection');
      continue;
    }
    value.forEach((item, index) => {
      validateDatum(errors, `${key}[${index}]`, item);
    });
  }

  if (data.root !== undefined) {
    validateDatum(errors, 'root', data.root);
  }

  if (data.relations !== undefined) {
    if (!Array.isArray(data.relations)) {
      pushError(errors, 'relations', 'relations 必须是数组', 'invalid_type');
    } else if (data.relations.length === 0) {
      pushError(errors, 'relations', 'relations 不能为空数组', 'empty_collection');
    } else {
      data.relations.forEach((item, index) => {
        validateRelation(errors, `relations[${index}]`, item);
      });
    }
  }

  if (data.order !== undefined && data.order !== 'asc' && data.order !== 'desc') {
    pushError(errors, 'order', 'order 必须是 "asc" 或 "desc"', 'invalid_value');
  }

  if (!hasNonEmptyCollection(data)) {
    pushError(
      errors,
      'data',
      `data 至少需要包含非空的 ${COLLECTION_KEYS.join(' / ')} / root / relations 之一`,
      'missing_field',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function mapSyntaxError(error: SyntaxError): ValidationIssue {
  return {
    path: error.path || 'syntax',
    message: error.message,
    code: 'syntax_error',
    line: error.line,
  };
}

/**
 * 校验 Infographic Syntax 字符串（与 `convertInfographicFromSyntax` 的 syntax 入参一致）。
 */
export function validateInfographicSyntax(syntax: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (typeof syntax !== 'string') {
    pushError(errors, 'syntax', 'syntax 必须是字符串', 'invalid_type');
    return { valid: false, errors, warnings };
  }

  const trimmed = syntax.trim();
  if (!trimmed) {
    pushError(errors, 'syntax', 'syntax 不能为空', 'empty');
    return { valid: false, errors, warnings };
  }

  const parsed = parseSyntax(trimmed);

  for (const error of parsed.errors) {
    errors.push(mapSyntaxError(error));
  }
  for (const warning of parsed.warnings) {
    warnings.push(mapSyntaxError(warning));
  }

  if (!parsed.options.template) {
    pushError(errors, 'template', 'syntax 缺少模板声明（infographic <template>）', 'missing_field');
  }

  if (parsed.options.data === undefined) {
    pushError(errors, 'data', 'syntax 缺少 data 区块', 'missing_field');
  } else {
    const dataResult = validateInfographicData(parsed.options.data);
    for (const error of dataResult.errors) {
      errors.push({
        ...error,
        path: error.path === 'data' ? 'data' : `data.${error.path}`,
      });
    }
    for (const warning of dataResult.warnings) {
      warnings.push({
        ...warning,
        path: warning.path === 'data' ? 'data' : `data.${warning.path}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 校验 `convertInfographicToDeck` 的 data，或 `convertInfographicFromSyntax` 的 syntax。
 *
 * @example
 * validateInfographicInput({ data: { title: '...', values: [...] } })
 * validateInfographicInput({ syntax: `infographic chart-bar-plain-text\n...` })
 */
export function validateInfographicInput(
  input: ValidateInfographicInputArg,
): ValidationResult {
  if (!isPlainObject(input)) {
    return {
      valid: false,
      errors: [
        {
          path: '',
          message: '入参必须是包含 data 或 syntax 的对象',
          code: 'invalid_type',
        },
      ],
      warnings: [],
    };
  }

  const hasData = Object.prototype.hasOwnProperty.call(input, 'data');
  const hasSyntax = Object.prototype.hasOwnProperty.call(input, 'syntax');

  if (hasData === hasSyntax) {
    return {
      valid: false,
      errors: [
        {
          path: '',
          message: '请只传入 data 或 syntax 其中之一',
          code: 'invalid_type',
        },
      ],
      warnings: [],
    };
  }

  if (hasData) {
    return validateInfographicData(input.data);
  }

  return validateInfographicSyntax(input.syntax);
}
