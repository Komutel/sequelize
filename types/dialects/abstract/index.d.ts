import type { Dialect } from '../../sequelize.js';
import type { AbstractConnectionManager } from './connection-manager.js';
import type { AbstractQueryGenerator } from './query-generator.js';
import type { AbstractQuery } from './query.js';
export declare type DialectSupports = {
    'DEFAULT': boolean;
    'DEFAULT VALUES': boolean;
    'VALUES ()': boolean;
    'LIMIT ON UPDATE': boolean;
    'ON DUPLICATE KEY': boolean;
    'ORDER NULLS': boolean;
    'UNION': boolean;
    'UNION ALL': boolean;
    'RIGHT JOIN': boolean;
    EXCEPTION: boolean;
    forShare?: 'LOCK IN SHARE MODE' | 'FOR SHARE' | undefined;
    lock: boolean;
    lockOf: boolean;
    lockKey: boolean;
    lockOuterJoinFailure: boolean;
    skipLocked: boolean;
    finalTable: boolean;
    returnValues: false | {
        output: boolean;
        returning: boolean;
    };
    autoIncrement: {
        identityInsert: boolean;
        defaultValue: boolean;
        update: boolean;
    };
    bulkDefault: boolean;
    schemas: boolean;
    transactions: boolean;
    settingIsolationLevelDuringTransaction: boolean;
    transactionOptions: {
        type: boolean;
    };
    migrations: boolean;
    upserts: boolean;
    inserts: {
        ignoreDuplicates: string;
        updateOnDuplicate: boolean | string;
        onConflictDoNothing: string;
        conflictFields: boolean;
    };
    constraints: {
        restrict: boolean;
        addConstraint: boolean;
        dropConstraint: boolean;
        unique: boolean;
        default: boolean;
        check: boolean;
        foreignKey: boolean;
        primaryKey: boolean;
        onUpdate: boolean;
    };
    index: {
        collate: boolean;
        length: boolean;
        parser: boolean;
        concurrently: boolean;
        type: boolean;
        using: boolean | number;
        functionBased: boolean;
        operator: boolean;
        where: boolean;
    };
    groupedLimit: boolean;
    indexViaAlter: boolean;
    alterColumn: {
        /**
         * Can "ALTER TABLE x ALTER COLUMN y" add UNIQUE to the column in this dialect?
         */
        unique: boolean;
    };
    JSON: boolean;
    JSONB: boolean;
    ARRAY: boolean;
    RANGE: boolean;
    NUMERIC: boolean;
    GEOMETRY: boolean;
    GEOGRAPHY: boolean;
    REGEXP: boolean;
    /**
     * Case-insensitive regexp operator support ('~*' in postgres).
     */
    IREGEXP: boolean;
    HSTORE: boolean;
    TSVECTOR: boolean;
    tmpTableTrigger: boolean;
    indexHints: boolean;
    searchPath: boolean;
    /**
     * This dialect supports marking a column's constraints as deferrable.
     * e.g. 'DEFERRABLE' and 'INITIALLY DEFERRED'
     */
    deferrableConstraints: false;
    /**
     * This dialect supports E-prefixed strings, e.g. "E'foo'", which
     * enables the ability to use backslash escapes inside of the string.
     */
    escapeStringConstants: boolean;
};
export declare abstract class AbstractDialect {
    /**
     * List of features this dialect supports.
     *
     * Important: Dialect implementations inherit these values.
     * When changing a default, ensure the implementations still properly declare which feature they support.
     */
    static readonly supports: DialectSupports;
    readonly defaultVersion: string;
    readonly Query: typeof AbstractQuery;
    readonly name: Dialect;
    readonly TICK_CHAR: string;
    readonly TICK_CHAR_LEFT: string;
    readonly TICK_CHAR_RIGHT: string;
    readonly queryGenerator: AbstractQueryGenerator;
    readonly connectionManager: AbstractConnectionManager;
    get supports(): DialectSupports;
    abstract createBindCollector(): BindCollector;
    /**
     * Whether this dialect can use \ in strings to escape string delimiters.
     *
     * @returns
     */
    canBackslashEscape(): boolean;
    static getDefaultPort(): number;
}
export declare type BindCollector = {
    /**
     *
     *
     * @param {string} bindParameterName The name of the bind parameter
     * @returns {string}
     */
    collect(bindParameterName: string): string;
    /**
     * Returns either an array of orders if the bind parameters are mapped to numeric parameters (e.g. '?', $1, @1),
     * or null if no mapping was necessary because the dialect supports named parameters.
     */
    getBindParameterOrder(): string[] | null;
};
