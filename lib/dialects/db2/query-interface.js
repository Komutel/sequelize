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
  Db2QueryInterface: () => Db2QueryInterface
});
module.exports = __toCommonJS(query_interface_exports);
var import_errors = require("../../errors");
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const Utils = require("../../utils");
const { Op } = require("../../operators");
const { QueryInterface } = require("../abstract/query-interface");
const { QueryTypes } = require("../../query-types");
class Db2QueryInterface extends QueryInterface {
  async getForeignKeyReferencesForTable(tableName, options) {
    const queryOptions = {
      ...options,
      type: QueryTypes.FOREIGNKEYS
    };
    const query = this.queryGenerator.getForeignKeysQuery(tableName, this.sequelize.config.username.toUpperCase());
    return this.sequelize.queryRaw(query, queryOptions);
  }
  async upsert(tableName, insertValues, updateValues, where, options) {
    if (options.bind) {
      (0, import_sql.assertNoReservedBind)(options.bind);
    }
    options = { ...options };
    const model = options.model;
    const wheres = [];
    const attributes = Object.keys(insertValues);
    let indexFields;
    options = _.clone(options);
    if (!Utils.isWhereEmpty(where)) {
      wheres.push(where);
    }
    const indexes = _.map(model.uniqueKeys, (value) => {
      return value.fields;
    });
    for (const value of model.getIndexes()) {
      if (value.unique) {
        indexFields = value.fields.map((field) => {
          if (_.isPlainObject(field)) {
            return field.attribute;
          }
          return field;
        });
        indexes.push(indexFields);
      }
    }
    for (const index of indexes) {
      if (_.intersection(attributes, index).length === index.length) {
        where = {};
        for (const field of index) {
          where[field] = insertValues[field];
        }
        wheres.push(where);
      }
    }
    where = { [Op.or]: wheres };
    options.type = QueryTypes.UPSERT;
    options.raw = true;
    const sql = this.queryGenerator.upsertQuery(tableName, insertValues, updateValues, where, model, options);
    delete options.replacements;
    const result = await this.sequelize.queryRaw(sql, options);
    return [result, void 0];
  }
  async dropSchema(schema, options) {
    const outParams = /* @__PURE__ */ new Map();
    const response = await super.dropSchema(schema, {
      ...options,
      _unsafe_db2Outparams: outParams
    });
    const errorTable = outParams.get("sequelize_errorTable");
    if (errorTable != null) {
      const errorSchema = outParams.get("sequelize_errorSchema");
      const errorData = await this.sequelize.queryRaw(`SELECT * FROM "${errorSchema}"."${errorTable}"`, {
        type: QueryTypes.SELECT
      });
      const error = new Error(errorData[0].DIAGTEXT);
      error.sqlcode = errorData[0].SQLCODE;
      error.sql = errorData[0].STATEMENT;
      error.state = errorData[0].SQLSTATE;
      const wrappedError = new import_errors.DatabaseError(error);
      try {
        await this.dropTable({
          tableName: errorTable,
          schema: errorSchema
        });
      } catch (dropError) {
        throw new import_errors.AggregateError([
          wrappedError,
          new Error(`An error occurred while cleaning up table ${errorSchema}.${errorTable}`, { cause: dropError })
        ]);
      }
      if (error.sqlcode === -204 && error.state === "42704") {
        return response;
      }
      throw wrappedError;
    }
    return response;
  }
  async createTable(tableName, attributes, options, model) {
    let sql = "";
    options = { ...options };
    if (options && options.uniqueKeys) {
      _.forOwn(options.uniqueKeys, (uniqueKey) => {
        if (uniqueKey.customIndex === void 0) {
          uniqueKey.customIndex = true;
        }
      });
    }
    if (model) {
      options.uniqueKeys = options.uniqueKeys || model.uniqueKeys;
    }
    attributes = _.mapValues(
      attributes,
      (attribute) => this.sequelize.normalizeAttribute(attribute)
    );
    if (!tableName.schema && (options.schema || Boolean(model) && model._schema)) {
      tableName = this.queryGenerator.addSchema({
        tableName,
        _schema: Boolean(model) && model._schema || options.schema
      });
    }
    attributes = this.queryGenerator.attributesToSQL(attributes, { table: tableName, context: "createTable", withoutForeignKeyConstraints: options.withoutForeignKeyConstraints });
    sql = this.queryGenerator.createTableQuery(tableName, attributes, options);
    return await this.sequelize.queryRaw(sql, options);
  }
  async addConstraint(tableName, options) {
    try {
      return await super.addConstraint(tableName, options);
    } catch (error) {
      if (!error.cause) {
        throw error;
      }
      if (error.cause.sqlcode !== -668 || error.cause.state !== "57007") {
        throw error;
      }
      await this.executeTableReorg(tableName);
      await super.addConstraint(tableName, options);
    }
  }
  async executeTableReorg(tableName) {
    return await this.sequelize.query(`CALL SYSPROC.ADMIN_CMD('REORG TABLE ${this.queryGenerator.quoteTable(tableName)}')`);
  }
}
//# sourceMappingURL=query-interface.js.map