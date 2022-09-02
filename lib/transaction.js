"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var transaction_exports = {};
__export(transaction_exports, {
  ISOLATION_LEVELS: () => ISOLATION_LEVELS,
  LOCK: () => LOCK,
  TRANSACTION_TYPES: () => TRANSACTION_TYPES,
  Transaction: () => Transaction
});
module.exports = __toCommonJS(transaction_exports);
var import_assert = __toESM(require("assert"));
class Transaction {
  sequelize;
  _afterCommitHooks = /* @__PURE__ */ new Set();
  savepoints = [];
  options;
  parent;
  id;
  name;
  finished;
  connection;
  constructor(sequelize, options) {
    this.sequelize = sequelize;
    const generateTransactionId = this.sequelize.dialect.queryGenerator.generateTransactionId;
    this.options = {
      type: sequelize.options.transactionType,
      isolationLevel: sequelize.options.isolationLevel,
      readOnly: false,
      ...options
    };
    this.parent = this.options.transaction ?? null;
    if (this.parent) {
      this.id = this.parent.id;
      this.parent.savepoints.push(this);
      this.name = `${this.id}-sp-${this.parent.savepoints.length}`;
    } else {
      const id = generateTransactionId();
      this.id = id;
      this.name = id;
    }
    delete this.options.transaction;
  }
  async commit() {
    if (this.finished) {
      throw new Error(`Transaction cannot be committed because it has been finished with state: ${this.finished}`);
    }
    try {
      await this.sequelize.getQueryInterface().commitTransaction(this, this.options);
      for (const hook of this._afterCommitHooks) {
        await Reflect.apply(hook, this, [this]);
      }
      this.cleanup();
    } catch (error) {
      console.warn(`Committing transaction ${this.id} failed with error ${error instanceof Error ? JSON.stringify(error.message) : String(error)}. We are killing its connection as it is now in an undetermined state.`);
      await this.forceCleanup();
      throw error;
    } finally {
      this.finished = "commit";
    }
  }
  async rollback() {
    if (this.finished) {
      throw new Error(`Transaction cannot be rolled back because it has been finished with state: ${this.finished}`);
    }
    if (!this.connection) {
      throw new Error("Transaction cannot be rolled back because it never started");
    }
    try {
      await this.sequelize.getQueryInterface().rollbackTransaction(this, this.options);
      this.cleanup();
    } catch (error) {
      console.warn(`Rolling back transaction ${this.id} failed with error ${error instanceof Error ? JSON.stringify(error.message) : String(error)}. We are killing its connection as it is now in an undetermined state.`);
      await this.forceCleanup();
      throw error;
    }
  }
  async prepareEnvironment(useCLS = true) {
    let connection;
    if (this.parent) {
      connection = this.parent.connection;
    } else {
      connection = await this.sequelize.connectionManager.getConnection({
        type: this.options.readOnly ? "read" : "write",
        uuid: this.id
      });
    }
    (0, import_assert.default)(connection != null, "Transaction failed to acquire Connection.");
    connection.uuid = this.id;
    this.connection = connection;
    let result;
    try {
      await this.begin();
      result = await this.setDeferrable();
    } catch (error) {
      try {
        await this.rollback();
      } finally {
        throw error;
      }
    }
    if (useCLS && this.sequelize.Sequelize._cls) {
      this.sequelize.Sequelize._cls.set("transaction", this);
    }
    return result;
  }
  async setDeferrable() {
    if (this.options.deferrable) {
      await this.sequelize.getQueryInterface().deferConstraints(this, this.options);
    }
  }
  async begin() {
    const queryInterface = this.sequelize.getQueryInterface();
    if (this.sequelize.dialect.supports.settingIsolationLevelDuringTransaction) {
      await queryInterface.startTransaction(this, this.options);
      return queryInterface.setIsolationLevel(this, this.options.isolationLevel, this.options);
    }
    await queryInterface.setIsolationLevel(this, this.options.isolationLevel, this.options);
    return queryInterface.startTransaction(this, this.options);
  }
  cleanup() {
    var _a;
    if (this.parent || ((_a = this.connection) == null ? void 0 : _a.uuid) === void 0) {
      return;
    }
    this.sequelize.connectionManager.releaseConnection(this.connection);
    this.connection.uuid = void 0;
  }
  async forceCleanup() {
    var _a;
    if (this.parent || ((_a = this.connection) == null ? void 0 : _a.uuid) === void 0) {
      return;
    }
    await this.sequelize.connectionManager.destroyConnection(this.connection);
    this.connection.uuid = void 0;
  }
  afterCommit(fn) {
    if (typeof fn !== "function") {
      throw new TypeError('"fn" must be a function');
    }
    this._afterCommitHooks.add(fn);
    return this;
  }
  static get TYPES() {
    return TRANSACTION_TYPES;
  }
  static get ISOLATION_LEVELS() {
    return ISOLATION_LEVELS;
  }
  static get LOCK() {
    return LOCK;
  }
  get LOCK() {
    return LOCK;
  }
}
var ISOLATION_LEVELS = /* @__PURE__ */ ((ISOLATION_LEVELS2) => {
  ISOLATION_LEVELS2["READ_UNCOMMITTED"] = "READ UNCOMMITTED";
  ISOLATION_LEVELS2["READ_COMMITTED"] = "READ COMMITTED";
  ISOLATION_LEVELS2["REPEATABLE_READ"] = "REPEATABLE READ";
  ISOLATION_LEVELS2["SERIALIZABLE"] = "SERIALIZABLE";
  return ISOLATION_LEVELS2;
})(ISOLATION_LEVELS || {});
var TRANSACTION_TYPES = /* @__PURE__ */ ((TRANSACTION_TYPES2) => {
  TRANSACTION_TYPES2["DEFERRED"] = "DEFERRED";
  TRANSACTION_TYPES2["IMMEDIATE"] = "IMMEDIATE";
  TRANSACTION_TYPES2["EXCLUSIVE"] = "EXCLUSIVE";
  return TRANSACTION_TYPES2;
})(TRANSACTION_TYPES || {});
var LOCK = /* @__PURE__ */ ((LOCK2) => {
  LOCK2["UPDATE"] = "UPDATE";
  LOCK2["SHARE"] = "SHARE";
  LOCK2["KEY_SHARE"] = "KEY SHARE";
  LOCK2["NO_KEY_UPDATE"] = "NO KEY UPDATE";
  return LOCK2;
})(LOCK || {});
//# sourceMappingURL=transaction.js.map
