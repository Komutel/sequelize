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
var connection_manager_exports = {};
__export(connection_manager_exports, {
  AbstractConnectionManager: () => AbstractConnectionManager
});
module.exports = __toCommonJS(connection_manager_exports);
var import_cloneDeep = __toESM(require("lodash/cloneDeep"));
var import_each = __toESM(require("lodash/each"));
var import_semver = __toESM(require("semver"));
var import_sequelize_pool = require("sequelize-pool");
var import_errors = require("../../errors");
var deprecations = __toESM(require("../../utils/deprecations"));
var import_utils = require("../../utils/index.js");
var import_logger = require("../../utils/logger");
var import_replication_pool = require("./replication-pool.js");
const debug = import_logger.logger.debugContext("connection-manager");
class AbstractConnectionManager {
  sequelize;
  config;
  dialect;
  dialectName;
  pool;
  #versionPromise = null;
  constructor(dialect, sequelize) {
    const config = (0, import_cloneDeep.default)(sequelize.config);
    this.sequelize = sequelize;
    this.config = config;
    this.dialect = dialect;
    this.dialectName = this.sequelize.options.dialect;
    this.pool = new import_replication_pool.ReplicationPool({
      ...config,
      connect: async (options) => {
        return this._connect(options);
      },
      disconnect: async (connection) => {
        return this._disconnect(connection);
      },
      validate: (connection) => {
        if (config.pool.validate) {
          return config.pool.validate(connection);
        }
        return this.validate(connection);
      },
      readConfig: config.replication.read,
      writeConfig: config.replication.write
    });
    if (config.replication.read.length > 0) {
      debug(`pool created with max/min: ${config.pool.max}/${config.pool.min}, no replication`);
    } else {
      debug(`pool created with max/min: ${config.pool.max}/${config.pool.min}, with replication`);
    }
  }
  refreshTypeParser(dataTypes) {
    (0, import_each.default)(dataTypes, (dataType) => {
      if (Object.prototype.hasOwnProperty.call(dataType, "parse")) {
        if (dataType.types[this.dialectName]) {
          this._refreshTypeParser(dataType);
        } else {
          throw new Error(`Parse function not supported for type ${dataType.key} in dialect ${this.dialectName}`);
        }
      }
    });
  }
  _refreshTypeParser(_dataType) {
    throw new Error(`_refreshTypeParser not implemented in ${this.constructor.name}`);
  }
  validate(_connection) {
    return true;
  }
  async connect(_config) {
    throw new Error(`connect not implemented in ${this.constructor.name}`);
  }
  async disconnect(_connection) {
    throw new Error(`disconnect not implemented in ${this.constructor.name}`);
  }
  _loadDialectModule(moduleName) {
    try {
      if (this.sequelize.config.dialectModulePath) {
        return require(this.sequelize.config.dialectModulePath);
      }
      if (this.sequelize.config.dialectModule) {
        return this.sequelize.config.dialectModule;
      }
      return require(moduleName);
    } catch (error) {
      if ((0, import_utils.isNodeError)(error) && error.code === "MODULE_NOT_FOUND") {
        if (this.sequelize.config.dialectModulePath) {
          throw new Error(`Unable to find dialect at ${this.sequelize.config.dialectModulePath}`);
        }
        throw new Error(`Please install ${moduleName} package manually`);
      }
      throw error;
    }
  }
  async _onProcessExit() {
    if (!this.pool) {
      return;
    }
    await this.pool.drain();
    debug("connection drain due to process exit");
    await this.pool.destroyAllNow();
  }
  async close() {
    this.getConnection = async function getConnection() {
      throw new Error("ConnectionManager.getConnection was called after the connection manager was closed!");
    };
    return this._onProcessExit();
  }
  async getConnection(options) {
    await this.#initDatabaseVersion();
    try {
      const result = await this.pool.acquire(options == null ? void 0 : options.type, options == null ? void 0 : options.useMaster);
      debug("connection acquired");
      return result;
    } catch (error) {
      if (error instanceof import_sequelize_pool.TimeoutError) {
        throw new import_errors.ConnectionAcquireTimeoutError(error);
      }
      throw error;
    }
  }
  async #initDatabaseVersion() {
    if (this.sequelize.options.databaseVersion !== 0) {
      return;
    }
    if (this.#versionPromise) {
      await this.#versionPromise;
      return;
    }
    this.#versionPromise = (async () => {
      var _a;
      try {
        const connection = await this._connect(this.config.replication.write || this.config);
        const options = {
          logging: () => {
          },
          transaction: { connection }
        };
        const version = await this.sequelize.databaseVersion(options);
        const parsedVersion = ((_a = import_semver.default.coerce(version)) == null ? void 0 : _a.version) || version;
        this.sequelize.options.databaseVersion = import_semver.default.valid(parsedVersion) ? parsedVersion : this.dialect.defaultVersion;
        if (import_semver.default.lt(this.sequelize.options.databaseVersion, this.dialect.defaultVersion)) {
          deprecations.unsupportedEngine();
          debug(`Unsupported database engine version ${this.sequelize.options.databaseVersion}`);
        }
        return await this._disconnect(connection);
      } finally {
        this.#versionPromise = null;
      }
    })();
    await this.#versionPromise;
  }
  releaseConnection(connection) {
    this.pool.release(connection);
    debug("connection released");
  }
  async destroyConnection(connection) {
    await this.pool.destroy(connection);
    debug(`connection ${connection.uuid} destroyed`);
  }
  async _connect(config) {
    await this.sequelize.runHooks("beforeConnect", config);
    const connection = await this.connect(config);
    await this.sequelize.runHooks("afterConnect", connection, config);
    return connection;
  }
  async _disconnect(connection) {
    await this.sequelize.runHooks("beforeDisconnect", connection);
    await this.disconnect(connection);
    await this.sequelize.runHooks("afterDisconnect", connection);
  }
}
//# sourceMappingURL=connection-manager.js.map
