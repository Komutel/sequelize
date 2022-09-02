"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var query_interface_exports = {};
__export(query_interface_exports, {
  SqliteQueryInterface: () => SqliteQueryInterface
});
module.exports = __toCommonJS(query_interface_exports);
const sequelizeErrors = require("../../errors");
const { QueryTypes } = require("../../query-types");
const { QueryInterface, QueryOptions, ColumnsDescription } = require("../abstract/query-interface");
const { cloneDeep } = require("../../utils");
const _ = require("lodash");
const uuid = require("uuid").v4;
class SqliteQueryInterface extends QueryInterface {
  async removeColumn(tableName, attributeName, options) {
    options = options || {};
    const fields = await this.describeTable(tableName, options);
    delete fields[attributeName];
    return this.alterTableInternal(tableName, fields, options);
  }
  async changeColumn(tableName, attributeName, dataTypeOrOptions, options) {
    options = options || {};
    const fields = await this.describeTable(tableName, options);
    Object.assign(fields[attributeName], this.normalizeAttribute(dataTypeOrOptions));
    return this.alterTableInternal(tableName, fields, options);
  }
  async renameColumn(tableName, attrNameBefore, attrNameAfter, options) {
    options = options || {};
    const fields = await this.assertTableHasColumn(tableName, attrNameBefore, options);
    fields[attrNameAfter] = { ...fields[attrNameBefore] };
    delete fields[attrNameBefore];
    const sql = this.queryGenerator.renameColumnQuery(tableName, attrNameBefore, attrNameAfter, fields);
    const subQueries = sql.split(";").filter((q) => q !== "");
    for (const subQuery of subQueries) {
      await this.sequelize.queryRaw(`${subQuery};`, { raw: true, ...options });
    }
  }
  async removeConstraint(tableName, constraintName, options) {
    let createTableSql;
    const constraints = await this.showConstraint(tableName, constraintName);
    const constraint = constraints.find((constaint) => constaint.constraintName === constraintName);
    if (!constraint) {
      throw new sequelizeErrors.UnknownConstraintError({
        message: `Constraint ${constraintName} on table ${tableName} does not exist`,
        constraint: constraintName,
        table: tableName
      });
    }
    createTableSql = constraint.sql;
    constraint.constraintName = this.queryGenerator.quoteIdentifier(constraint.constraintName);
    let constraintSnippet = `, CONSTRAINT ${constraint.constraintName} ${constraint.constraintType} ${constraint.constraintCondition}`;
    if (constraint.constraintType === "FOREIGN KEY") {
      const referenceTableName = this.queryGenerator.quoteTable(constraint.referenceTableName);
      constraint.referenceTableKeys = constraint.referenceTableKeys.map((columnName) => this.queryGenerator.quoteIdentifier(columnName));
      const referenceTableKeys = constraint.referenceTableKeys.join(", ");
      constraintSnippet += ` REFERENCES ${referenceTableName} (${referenceTableKeys})`;
      constraintSnippet += ` ON UPDATE ${constraint.updateAction}`;
      constraintSnippet += ` ON DELETE ${constraint.deleteAction}`;
    }
    createTableSql = createTableSql.replace(constraintSnippet, "");
    createTableSql += ";";
    const fields = await this.describeTable(tableName, options);
    const sql = this.queryGenerator._alterConstraintQuery(tableName, fields, createTableSql);
    const subQueries = sql.split(";").filter((q) => q !== "");
    for (const subQuery of subQueries) {
      await this.sequelize.queryRaw(`${subQuery};`, { raw: true, ...options });
    }
  }
  async addConstraint(tableName, options) {
    if (!options.fields) {
      throw new Error("Fields must be specified through options.fields");
    }
    if (!options.type) {
      throw new Error("Constraint type must be specified through options.type");
    }
    options = cloneDeep(options);
    const constraintSnippet = this.queryGenerator.getConstraintSnippet(tableName, options);
    const describeCreateTableSql = this.queryGenerator.describeCreateTableQuery(tableName);
    const constraints = await this.sequelize.queryRaw(describeCreateTableSql, { ...options, type: QueryTypes.SELECT, raw: true });
    let sql = constraints[0].sql;
    const index = sql.length - 1;
    const createTableSql = `${sql.slice(0, Math.max(0, index))}, ${constraintSnippet})${sql.slice(index + 1)};`;
    const fields = await this.describeTable(tableName, options);
    sql = this.queryGenerator._alterConstraintQuery(tableName, fields, createTableSql);
    const subQueries = sql.split(";").filter((q) => q !== "");
    for (const subQuery of subQueries) {
      await this.sequelize.queryRaw(`${subQuery};`, { raw: true, ...options });
    }
  }
  async getForeignKeyReferencesForTable(tableName, options) {
    const database = this.sequelize.config.database;
    const query = this.queryGenerator.getForeignKeysQuery(tableName, database);
    const result = await this.sequelize.queryRaw(query, options);
    return result.map((row) => ({
      tableName,
      columnName: row.from,
      referencedTableName: row.table,
      referencedColumnName: row.to,
      tableCatalog: database,
      referencedTableCatalog: database,
      constraints: {
        onUpdate: row.on_update,
        onDelete: row.on_delete
      }
    }));
  }
  async dropAllTables(options) {
    options = options || {};
    const skip = options.skip || [];
    const tableNames = await this.showAllTables(options);
    await this.sequelize.queryRaw("PRAGMA foreign_keys = OFF", options);
    await this._dropAllTables(tableNames, skip, options);
    await this.sequelize.queryRaw("PRAGMA foreign_keys = ON", options);
  }
  async describeTable(tableName, options) {
    let schema = null;
    let schemaDelimiter = null;
    if (typeof options === "string") {
      schema = options;
    } else if (typeof options === "object" && options !== null) {
      schema = options.schema || null;
      schemaDelimiter = options.schemaDelimiter || null;
    }
    if (typeof tableName === "object" && tableName !== null) {
      schema = tableName.schema;
      tableName = tableName.tableName;
    }
    const sql = this.queryGenerator.describeTableQuery(tableName, schema, schemaDelimiter);
    options = { ...options, type: QueryTypes.DESCRIBE };
    const sqlIndexes = this.queryGenerator.showIndexesQuery(tableName);
    try {
      const data = await this.sequelize.queryRaw(sql, options);
      if (_.isEmpty(data)) {
        throw new Error(`No description found for "${tableName}" table. Check the table name and schema; remember, they _are_ case sensitive.`);
      }
      const indexes = await this.sequelize.queryRaw(sqlIndexes, options);
      for (const prop in data) {
        data[prop].unique = false;
      }
      for (const index of indexes) {
        for (const field of index.fields) {
          if (index.unique !== void 0) {
            data[field.attribute].unique = index.unique;
          }
        }
      }
      const foreignKeys = await this.getForeignKeyReferencesForTable(tableName, options);
      for (const foreignKey of foreignKeys) {
        data[foreignKey.columnName].references = {
          model: foreignKey.referencedTableName,
          key: foreignKey.referencedColumnName
        };
        Object.assign(data[foreignKey.columnName], {
          onUpdate: foreignKey.constraints.onUpdate,
          onDelete: foreignKey.constraints.onDelete
        });
      }
      return data;
    } catch (error) {
      if (error.original && error.original.code === "ER_NO_SUCH_TABLE") {
        throw new Error(`No description found for "${tableName}" table. Check the table name and schema; remember, they _are_ case sensitive.`);
      }
      throw error;
    }
  }
  async alterTableInternal(tableName, fields, options) {
    return this.withForeignKeysOff(options, async () => {
      const savepointName = this.getSavepointName();
      await this.sequelize.query(`SAVEPOINT ${savepointName};`, options);
      try {
        const sql = this.queryGenerator.removeColumnQuery(tableName, fields);
        const subQueries = sql.split(";").filter((q) => q !== "");
        for (const subQuery of subQueries) {
          await this.sequelize.query(`${subQuery};`, { raw: true, ...options });
        }
        const foreignKeyCheckResult = await this.sequelize.query(this.queryGenerator.foreignKeyCheckQuery(tableName), {
          ...options,
          type: QueryTypes.SELECT
        });
        if (foreignKeyCheckResult.length > 0) {
          throw new sequelizeErrors.ForeignKeyConstraintError({
            message: `Foreign key violations detected: ${JSON.stringify(foreignKeyCheckResult, null, 2)}`,
            table: tableName
          });
        }
        await this.sequelize.query(`RELEASE ${savepointName};`, options);
      } catch (error) {
        await this.sequelize.query(`ROLLBACK TO ${savepointName};`, options);
        throw error;
      }
    });
  }
  async withForeignKeysOff(options, cb) {
    await this.sequelize.query("PRAGMA foreign_keys = OFF;", options);
    try {
      return await cb();
    } finally {
      await this.sequelize.query("PRAGMA foreign_keys = ON;", options);
    }
  }
  getSavepointName(prefix = "sequelize") {
    const suffix = uuid().replace(/-/g, "_");
    return `${prefix}_${suffix}`;
  }
}
//# sourceMappingURL=query-interface.js.map
