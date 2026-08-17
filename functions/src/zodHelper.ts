import { z } from 'zod';

/**
 * Converts a dynamic schema object from request payload into a validated ZodObject schema.
 * Supports:
 * 1. JSON Schema format ({ type: "object", properties: { ... }, required: [...] })
 * 2. Property dictionary ({ name: { type: "string", description: "..." } })
 * 3. Simple key-type map ({ name: "string", age: "number", tags: "string[]" })
 */
export function buildZodSchema(rawSchema: any): z.ZodObject<any> {
  if (!rawSchema || typeof rawSchema !== 'object') {
    throw new Error('Schema must be a valid non-null object');
  }

  // If top level is JSON Schema wrapper with properties
  const properties = rawSchema.properties || (rawSchema.type === 'object' && rawSchema.fields) || rawSchema;

  if (typeof properties !== 'object' || Object.keys(properties).length === 0) {
    throw new Error('Schema object must contain at least one field property definition.');
  }

  const requiredList: string[] = Array.isArray(rawSchema.required) ? rawSchema.required : [];
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip internal JSON Schema keywords if top level was passed as property map directly
    if (key === 'type' && typeof value === 'string' && rawSchema.properties) continue;
    if (key === '$schema' || key === 'required' || key === 'title' || key === 'description') continue;

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
    } else if (type === 'object' || fieldDef.properties) {
      const subProps = fieldDef.properties || fieldDef.fields || {};
      const subShape: Record<string, z.ZodTypeAny> = {};
      const subRequired: string[] = Array.isArray(fieldDef.required) ? fieldDef.required : [];

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
