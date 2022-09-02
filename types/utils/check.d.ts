/// <reference types="node" />
import type { DataType } from '..';
import { Where } from './sequelize-method';
export declare function isPrimitive(val: any): val is string | number | boolean;
export declare function isNodeError(val: any): val is NodeJS.ErrnoException;
export declare function isError(val: any): val is Error;
export declare function isString(val: any): val is string;
/**
 * Returns whether `value` is using the nested syntax for attributes.
 *
 * @param value The attribute reference to check.
 *
 * @example
 * ```javascript
 * isColString('$id$'); // true
 * isColString('$project.name$'); // true
 * isColString('name'); // false
 * ```
 */
export declare function isColString(value: string): boolean;
export declare function canTreatArrayAsAnd(arr: unknown[]): arr is Array<object | Where>;
/**
 * Determine if the default value provided exists and can be described
 * in a db schema using the DEFAULT directive.
 *
 * @param value Any default value.
 * @private
 */
export declare function defaultValueSchemable(value: DataType): boolean;
/**
 * Returns true if a where clause is empty, even with Symbols
 *
 * @param obj
 */
export declare function isWhereEmpty(obj: object): boolean;
