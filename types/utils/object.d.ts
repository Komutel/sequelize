/**
 * Deeply merges object `b` into `a`.
 * Mutates `a`.
 *
 * Same concept as _.merge, but doesn't overwrite properties that have already been assigned.
 *
 * @param a
 * @param b
 */
export declare function mergeDefaults<T>(a: T, b: Partial<T>): T;
/**
 * An alternative to _.merge, which doesn't clone its arguments.
 *
 * Does not mutate parameters.
 *
 * Cloning is a bad idea because options arguments may contain references to sequelize
 * models - which again reference database libs which don't like to be cloned (in particular pg-native)
 *
 * @param args
 */
export declare function merge(...args: object[]): object;
export declare function cloneDeep<T extends object>(obj: T, onlyPlain?: boolean): T;
/**
 * Receives a tree-like object and returns a plain object which depth is 1.
 *
 * - Input:
 *
 *  {
 *    name: 'John',
 *    address: {
 *      street: 'Fake St. 123',
 *      coordinates: {
 *        longitude: 55.6779627,
 *        latitude: 12.5964313
 *      }
 *    }
 *  }
 *
 * - Output:
 *
 *  {
 *    name: 'John',
 *    address.street: 'Fake St. 123',
 *    address.coordinates.latitude: 55.6779627,
 *    address.coordinates.longitude: 12.5964313
 *  }
 *
 * @param value an Object
 * @returns a flattened object
 * @private
 */
export declare function flattenObjectDeep<T>(value: T): T extends object ? Flatten<T> : T;
declare type Flatten<T extends object> = object extends T ? object : {
    [K in keyof T]-?: (x: NonNullable<T[K]> extends infer V ? V extends object ? V extends readonly any[] ? Pick<T, K> : Flatten<V> extends infer FV ? ({
        [P in keyof FV as `${Extract<K, string | number>}.${Extract<P, string | number>}`]: FV[P];
    }) : never : Pick<T, K> : never) => void;
} extends Record<keyof T, (y: infer O) => void> ? O extends unknown ? {
    [K in keyof O]: O[K];
} : never : never;
/**
 * Assigns own and inherited enumerable string and symbol keyed properties of source
 * objects to the destination object.
 *
 * https://lodash.com/docs/4.17.4#defaults
 *
 * **Note:** This method mutates `object`.
 *
 * @param objectIn The destination object.
 * @param sources The source objects.
 * @returns Returns `object`.
 * @private
 */
export declare function defaults(objectIn: {
    [key: string]: any;
}, // TODO [2022-09-01]: key should be string | symbol once we drop support for TS 4.4
...sources: Array<{
    [key: string]: any;
}>): object;
/**
 * @param obj
 * @returns A new object with camel-cased keys
 * @private
 */
export declare function camelizeObjectKeys(obj: {
    [key: string]: any;
}): {
    [key: string]: any;
};
declare type NoUndefinedField<T> = {
    [P in keyof T]: Exclude<T[P], null | undefined>;
};
export declare function removeUndefined<T>(val: T): NoUndefinedField<T>;
export {};