import _inflection from 'inflection';
import type { IndexOptions, TableName } from '../dialects/abstract/query-interface.js';
declare type Inflection = typeof _inflection;
export declare function useInflection(newInflection: Inflection): void;
export declare function camelizeIf(str: string, condition: boolean): string;
export declare function camelize(str: string): string;
export declare function underscoredIf(str: string, condition: boolean): string;
export declare function underscore(str: string): string;
export declare function spliceStr(str: string, index: number, count: number, add: string): string;
export declare function singularize(str: string): string;
export declare function pluralize(str: string): string;
declare type NameIndexIndex = {
    fields: Array<{
        name: string;
        attribute: string;
    }>;
    name: string;
};
/**
 *
 * @param index
 * @param index.fields
 * @param index.name
 * @param tableName
 *
 * @private
 */
export declare function nameIndex(index: NameIndexIndex, tableName: TableName): NameIndexIndex;
export declare function generateIndexName(tableName: TableName, index: IndexOptions): string;
/**
 * Stringify a value as JSON with some differences:
 * - bigints are stringified as a json string. (`safeStringifyJson({ val: 1n })` outputs `'{ "val": "1" }'`).
 *   This is because of a decision by TC39 to not support bigint in JSON.stringify https://github.com/tc39/proposal-bigint/issues/24
 *
 * @param stringifyTarget the value to stringify.
 * @returns the resulting json.
 */
export declare function safeStringifyJson(stringifyTarget: any): string;
export declare function removeTrailingSemicolon(str: string): string;
export {};
