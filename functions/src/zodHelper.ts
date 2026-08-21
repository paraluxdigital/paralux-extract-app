import { z } from 'zod';

/**
 * Converts a dynamic schema object from request payload into a validated ZodObject schema.
 */
export function buildZodSchema(rawSchema: any): z.ZodObject<any> {
  if (!rawSchema || typeof rawSchema !== 'object') {
    throw new Error('Schema must be a valid non-null object');
  }

  const isWrapped = rawSchema.type === 'object' && rawSchema.properties;
  const properties = isWrapped ? rawSchema.properties : (rawSchema.properties || rawSchema.fields || rawSchema);

  if (typeof properties !== 'object' || Object.keys(properties).length === 0) {
    throw new Error('Schema object must contain at least one field property definition.');
  }

  const requiredList: string[] = Array.isArray(rawSchema.required) ? rawSchema.required : [];
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (!isWrapped && (key === '$schema' || (key === 'type' && value === 'object'))) continue;
    shape[key] = convertFieldToZod(value, requiredList.includes(key));
  }

  return z.object(shape);
}

function convertFieldToZod(fieldDef: any, isRequired: boolean = false): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  if (typeof fieldDef === 'string') {
    const typeStr = fieldDef.toLowerCase().trim();
    if (typeStr.endsWith('[]')) {
      const itemType = typeStr.slice(0, -2);
      schema = z.array(primitiveStringToZod(itemType));
    } else {
      schema = primitiveStringToZod(typeStr);
    }
  } else if (typeof fieldDef === 'object' && fieldDef !== null) {
    const type = (fieldDef.type || 'string').toLowerCase();
    const description = fieldDef.description || fieldDef.describe;

    if (type === 'string') {
      schema = z.string();
    } else if (type === 'number' || type === 'integer' || type === 'float') {
      schema = z.number();
    } else if (type === 'boolean' || type === 'bool') {
      schema = z.boolean();
    } else if (type === 'array') {
      const itemsDef = fieldDef.items || 'string';
      schema = z.array(convertFieldToZod(itemsDef, true));
    } else if (type === 'object' || fieldDef.properties || fieldDef.fields) {
      const subProps = fieldDef.properties || fieldDef.fields || {};
      const subShape: Record<string, z.ZodTypeAny> = {};
      const subRequired: string[] = Array.isArray(fieldDef.required) ? fieldDef.required : Object.keys(subProps);

      for (const [k, v] of Object.entries(subProps)) {
        subShape[k] = convertFieldToZod(v, subRequired.includes(k));
      }
      schema = z.object(subShape);
    } else if (Array.isArray(fieldDef.enum)) {
      schema = z.enum(fieldDef.enum as [string, ...string[]]);
    } else {
      schema = z.string();
    }

    if (description && typeof description === 'string') {
      schema = schema.describe(description);
    }
  } else {
    schema = z.string();
  }

  if (!isRequired) {
    schema = schema.optional();
  }

  return schema;
}

function primitiveStringToZod(typeStr: string): z.ZodTypeAny {
  switch (typeStr) {
    case 'number':
    case 'integer':
    case 'float':
      return z.number();
    case 'boolean':
    case 'bool':
      return z.boolean();
    case 'object':
      return z.object({});
    case 'string':
    default:
      return z.string();
  }
}

/**
 * Normalizes input schema into standard JSON Schema object for Gemini responseSchema.
 */
export function normalizeJsonSchema(rawSchema: any): Record<string, any> {
  if (!rawSchema || typeof rawSchema !== 'object') {
    throw new Error('Schema must be a valid non-null object');
  }

  const isWrapped = rawSchema.type === 'object' && rawSchema.properties;
  const rawProps = isWrapped ? rawSchema.properties : (rawSchema.properties || rawSchema.fields || rawSchema);

  const properties: Record<string, any> = {};
  const required: string[] = Array.isArray(rawSchema.required) ? [...rawSchema.required] : [];

  for (const [key, value] of Object.entries(rawProps)) {
    if (!isWrapped && (key === '$schema' || (key === 'type' && value === 'object'))) continue;
    properties[key] = normalizeFieldDef(value);
    if (!rawSchema.required && !required.includes(key)) {
      required.push(key);
    }
  }

  return {
    type: 'OBJECT',
    properties,
    required: required.length > 0 ? required : Object.keys(properties),
  };
}

function normalizeFieldDef(fieldDef: any): Record<string, any> {
  if (typeof fieldDef === 'string') {
    const t = fieldDef.toLowerCase().trim();
    if (t.endsWith('[]')) {
      return { type: 'ARRAY', items: normalizeFieldDef(t.slice(0, -2)) };
    }
    return { type: t === 'number' || t === 'integer' || t === 'float' ? 'NUMBER' : t === 'boolean' || t === 'bool' ? 'BOOLEAN' : 'STRING' };
  }

  if (typeof fieldDef === 'object' && fieldDef !== null) {
    const rawType = (fieldDef.type || (fieldDef.properties ? 'OBJECT' : 'STRING')).toUpperCase();
    const type = rawType === 'INTEGER' || rawType === 'FLOAT' ? 'NUMBER' : rawType === 'BOOL' ? 'BOOLEAN' : rawType;
    const out: Record<string, any> = { type };

    if (fieldDef.description) {
      out.description = fieldDef.description;
    }

    if (type === 'ARRAY') {
      if (fieldDef.items) {
        out.items = normalizeFieldDef(fieldDef.items);
      } else {
        out.items = { type: 'STRING' };
      }
    }

    if (type === 'OBJECT' || fieldDef.properties || fieldDef.fields) {
      out.type = 'OBJECT';
      const propsSource = fieldDef.properties || fieldDef.fields || {};
      const subProps: Record<string, any> = {};
      const subRequired: string[] = Array.isArray(fieldDef.required) ? [...fieldDef.required] : [];

      for (const [k, v] of Object.entries(propsSource)) {
        subProps[k] = normalizeFieldDef(v);
        if (!fieldDef.required && !subRequired.includes(k)) {
          subRequired.push(k);
        }
      }

      out.properties = subProps;
      if (subRequired.length > 0) {
        out.required = subRequired;
      }
    }

    if (Array.isArray(fieldDef.enum)) {
      out.enum = fieldDef.enum;
    }

    return out;
  }

  return { type: 'STRING' };
}
