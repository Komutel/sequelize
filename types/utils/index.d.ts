import type { Optional } from '..';
export * from './array';
export * from './check';
export * from './class-to-invokable';
export * from './dialect';
export * from './format';
export * from './join-sql-fragments';
export * from './object';
export * from './sequelize-method';
export * from './string';
export * from './dayjs';
/**
 * getComplexSize
 *
 * @param obj
 * @returns Length of object properties including operators if obj is array returns its length
 * @private
 */
export declare function getComplexSize(obj: object | any[]): number;
export declare type DeepWriteable<T> = {
    -readonly [P in keyof T]: DeepWriteable<T[P]>;
};
export declare type PartlyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export declare type AnyFunction = (...args: any[]) => any;
/**
 * Returns all shallow properties that accept `undefined` or `null`.
 * Does not include Optional properties, only `undefined` or `null`.
 *
 * @example
 * ```typescript
 * type UndefinedProps = NullishPropertiesOf<{
 *   id: number | undefined,
 *   createdAt: string | undefined,
 *   firstName: string | null, // nullable properties are included
 *   lastName?: string, // optional properties are not included.
 * }>;
 *
 * // is equal to
 *
 * type UndefinedProps = 'id' | 'createdAt' | 'firstName';
 * ```
 */
export declare type NullishPropertiesOf<T> = {
    [P in keyof T]-?: undefined extends T[P] ? P : null extends T[P] ? P : never;
}[keyof T];
/**
 * Makes all shallow properties of an object `optional` if they accept `undefined` or `null` as a value.
 *
 * @example
 * ```typescript
 * type MyOptionalType = MakeUndefinedOptional<{
 *   id: number | undefined,
 *   firstName: string,
 *   lastName: string | null,
 * }>;
 *
 * // is equal to
 *
 * type MyOptionalType = {
 *   // this property is optional.
 *   id?: number | undefined,
 *   firstName: string,
 *   // this property is optional.
 *   lastName?: string | null,
 * };
 * ```
 */
export declare type MakeNullishOptional<T extends object> = Optional<T, NullishPropertiesOf<T>>;
/**
 * Makes the type accept null & undefined
 */
export declare type Nullish<T> = T | null | undefined;
export declare type AllowArray<T> = T | T[];
export declare type AllowReadonlyArray<T> = T | readonly T[];
declare type NonConstructorKeys<T> = ({
    [P in keyof T]: T[P] extends new () => any ? never : P;
})[keyof T];
export declare type OmitConstructors<T> = Pick<T, NonConstructorKeys<T>>;
