import type { Model, ModelStatic, WhereOptions, Attributes, BuiltModelAttributeColumOptions } from '..';
export declare type FinderOptions<TAttributes> = {
    attributes?: string[];
    where?: WhereOptions<TAttributes>;
};
export declare type MappedFinderOptions<TAttributes> = Omit<FinderOptions<TAttributes>, 'attributes'> & {
    attributes?: Array<[columnName: string, attributeName: string] | string>;
};
/**
 * Expand and normalize finder options.
 * Mutates the "options" parameter.
 *
 * @param options
 * @param Model
 */
export declare function mapFinderOptions<M extends Model, T extends FinderOptions<Attributes<M>>>(options: T, Model: ModelStatic<Model>): MappedFinderOptions<Attributes<M>>;
/**
 * Used to map field names in attributes and where conditions.
 *
 * Mutates the "options" parameter.
 *
 * @param options
 * @param Model
 */
export declare function mapOptionFieldNames<M extends Model>(options: FinderOptions<Attributes<M>>, Model: ModelStatic<Model>): MappedFinderOptions<Attributes<M>>;
export declare function mapWhereFieldNames(where: Record<string | symbol, any>, Model: ModelStatic<Model>): object;
/**
 * getComplexKeys
 *
 * @param obj
 * @returns All keys including operators
 * @private
 */
export declare function getComplexKeys(obj: object): Array<string | symbol>;
/**
 * getOperators
 *
 * @param obj
 * @returns All operators properties of obj
 * @private
 */
export declare function getOperators(obj: object): symbol[];
export declare function combineTableNames(tableName1: string, tableName2: string): string;
/**
 * Used to map field names in values
 *
 * @param dataValues
 * @param attributeNames
 * @param ModelClass
 */
export declare function mapValueFieldNames(// TODO: rename to mapAttributesToColumNames? See https://github.com/sequelize/meetings/issues/17
dataValues: Record<string, any>, attributeNames: string[], ModelClass: ModelStatic<Model>): Record<string, any>;
/**
 * Removes entries from `hash` whose value is either null or undefined, unless `omitNull` is false or `allowNull` includes that key.
 *
 * Keys ending with 'Id' are never removed.
 *
 * @param hash the object from which entries with nullish values will be removed.
 * @param omitNull if false, this method returns the object as-is
 * @param options
 * @param options.allowNull A list of keys that must be preserved even if their value is null or undefined.
 */
export declare function removeNullishValuesFromHash(hash: Record<string, any>, omitNull: boolean, options?: {
    allowNull?: string[];
}): Record<string, any>;
/**
 * Returns ENUM name by joining table and column name
 *
 * @param tableName
 * @param columnName
 * @private
 */
export declare function generateEnumName(tableName: string, columnName: string): string;
export declare function getColumnName(attribute: BuiltModelAttributeColumOptions): string;
