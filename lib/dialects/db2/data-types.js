"use strict";
const dayjs = require("dayjs");
module.exports = (BaseTypes) => {
  const warn = BaseTypes.ABSTRACT.warn.bind(
    void 0,
    "https://www.ibm.com/support/knowledgecenter/SSEPGG_11.1.0/com.ibm.db2.luw.sql.ref.doc/doc/r0008478.html"
  );
  function removeUnsupportedIntegerOptions(dataType) {
    if (dataType._length || dataType.options.length > 0 || dataType._unsigned || dataType._zerofill) {
      warn(`Db2 does not support '${dataType.key}' with options. Plain '${dataType.key}' will be used instead.`);
      dataType._length = void 0;
      dataType.options.length = void 0;
      dataType._unsigned = void 0;
      dataType._zerofill = void 0;
    }
  }
  BaseTypes.DATE.types.db2 = ["TIMESTAMP"];
  BaseTypes.STRING.types.db2 = ["VARCHAR"];
  BaseTypes.CHAR.types.db2 = ["CHAR"];
  BaseTypes.TEXT.types.db2 = ["VARCHAR", "CLOB"];
  BaseTypes.TINYINT.types.db2 = ["SMALLINT"];
  BaseTypes.SMALLINT.types.db2 = ["SMALLINT"];
  BaseTypes.MEDIUMINT.types.db2 = ["INTEGER"];
  BaseTypes.INTEGER.types.db2 = ["INTEGER"];
  BaseTypes.BIGINT.types.db2 = ["BIGINT"];
  BaseTypes.FLOAT.types.db2 = ["DOUBLE", "REAL", "FLOAT"];
  BaseTypes.TIME.types.db2 = ["TIME"];
  BaseTypes.DATEONLY.types.db2 = ["DATE"];
  BaseTypes.BOOLEAN.types.db2 = ["BOOLEAN", "BOOL", "SMALLINT", "BIT"];
  BaseTypes.BLOB.types.db2 = ["BLOB"];
  BaseTypes.DECIMAL.types.db2 = ["DECIMAL"];
  BaseTypes.UUID.types.db2 = ["CHAR () FOR BIT DATA"];
  BaseTypes.ENUM.types.db2 = ["VARCHAR"];
  BaseTypes.REAL.types.db2 = ["REAL"];
  BaseTypes.DOUBLE.types.db2 = ["DOUBLE"];
  BaseTypes.GEOMETRY.types.db2 = false;
  class BLOB extends BaseTypes.BLOB {
    toSql() {
      if (this._length) {
        if (this._length.toLowerCase() === "tiny") {
          return "BLOB(255)";
        }
        if (this._length.toLowerCase() === "medium") {
          return "BLOB(16M)";
        }
        if (this._length.toLowerCase() === "long") {
          return "BLOB(2G)";
        }
        return `BLOB(${this._length})`;
      }
      return "BLOB";
    }
    escape(blob) {
      return `BLOB('${blob.toString().replace(/'/g, "''")}')`;
    }
    _stringify(value) {
      if (Buffer.isBuffer(value)) {
        return `BLOB('${value.toString().replace(/'/g, "''")}')`;
      }
      if (Array.isArray(value)) {
        value = Buffer.from(value);
      } else {
        value = Buffer.from(value.toString());
      }
      const hex = value.toString("hex");
      return this._hexify(hex);
    }
    _hexify(hex) {
      return `x'${hex}'`;
    }
  }
  class STRING extends BaseTypes.STRING {
    toSql() {
      if (!this._binary) {
        if (this._length <= 4e3) {
          return `VARCHAR(${this._length})`;
        }
        return `CLOB(${this._length})`;
      }
      if (this._length < 255) {
        return `CHAR(${this._length}) FOR BIT DATA`;
      }
      if (this._length <= 4e3) {
        return `VARCHAR(${this._length}) FOR BIT DATA`;
      }
      return `BLOB(${this._length})`;
    }
    _stringify(value, options) {
      if (this._binary) {
        return BLOB.prototype._hexify(value.toString("hex"));
      }
      return options.escape(value);
    }
    _bindParam(value, options) {
      return options.bindParam(this._binary ? Buffer.from(value) : value);
    }
  }
  STRING.prototype.escape = false;
  class TEXT extends BaseTypes.TEXT {
    toSql() {
      let len = 0;
      if (this._length) {
        switch (this._length.toLowerCase()) {
          case "tiny":
            len = 256;
            break;
          case "medium":
            len = 8192;
            break;
          case "long":
            len = 65536;
            break;
        }
        if (isNaN(this._length)) {
          this._length = 32672;
        }
        if (len > 0) {
          this._length = len;
        }
      } else {
        this._length = 32672;
      }
      if (this._length > 32672) {
        len = `CLOB(${this._length})`;
      } else {
        len = `VARCHAR(${this._length})`;
      }
      warn(`Db2 does not support TEXT datatype. ${len} will be used instead.`);
      return len;
    }
  }
  class BOOLEAN extends BaseTypes.BOOLEAN {
    toSql() {
      return "BOOLEAN";
    }
    _sanitize(value) {
      if (value !== null && value !== void 0) {
        if (Buffer.isBuffer(value) && value.length === 1) {
          value = value[0];
        }
        if (typeof value === "string") {
          value = value === "true" ? true : value === "false" ? false : value;
          value = value === "" ? true : value === "\0" ? false : value;
        } else if (typeof value === "number") {
          value = value === 1 ? true : value === 0 ? false : value;
        }
      }
      return value;
    }
  }
  BOOLEAN.parse = BOOLEAN.prototype._sanitize;
  class UUID extends BaseTypes.UUID {
    toSql() {
      return "CHAR(36) FOR BIT DATA";
    }
  }
  class NOW extends BaseTypes.NOW {
    toSql() {
      return "CURRENT TIME";
    }
  }
  class DATE extends BaseTypes.DATE {
    toSql() {
      if (this._length < 0) {
        this._length = 0;
      }
      if (this._length > 6) {
        this._length = 6;
      }
      return `TIMESTAMP${this._length ? `(${this._length})` : ""}`;
    }
    _stringify(date, options) {
      date = this._applyTimezone(date, options);
      if (this._length > 0) {
        let msec = ".";
        for (let i = 0; i < this._length && i < 6; i++) {
          msec += "S";
        }
        return date.format(`YYYY-MM-DD HH:mm:ss${msec}`);
      }
      return date.format("YYYY-MM-DD HH:mm:ss");
    }
    static parse(value) {
      if (typeof value !== "string") {
        value = value.string();
      }
      if (value === null) {
        return value;
      }
      value = new Date(dayjs.utc(value));
      return value;
    }
  }
  class DATEONLY extends BaseTypes.DATEONLY {
    static parse(value) {
      return dayjs(value).format("YYYY-MM-DD");
    }
  }
  class INTEGER extends BaseTypes.INTEGER {
    constructor(length) {
      super(length);
      removeUnsupportedIntegerOptions(this);
    }
  }
  class TINYINT extends BaseTypes.TINYINT {
    constructor(length) {
      super(length);
      removeUnsupportedIntegerOptions(this);
    }
  }
  class SMALLINT extends BaseTypes.SMALLINT {
    constructor(length) {
      super(length);
      removeUnsupportedIntegerOptions(this);
    }
  }
  class BIGINT extends BaseTypes.BIGINT {
    constructor(length) {
      super(length);
      removeUnsupportedIntegerOptions(this);
    }
  }
  class REAL extends BaseTypes.REAL {
    constructor(length, decimals) {
      super(length, decimals);
      if (this._length || this.options.length > 0 || this._unsigned || this._zerofill) {
        warn("Db2 does not support REAL with options. Plain `REAL` will be used instead.");
        this._length = void 0;
        this.options.length = void 0;
        this._unsigned = void 0;
        this._zerofill = void 0;
      }
    }
  }
  class FLOAT extends BaseTypes.FLOAT {
    constructor(length, decimals) {
      super(length, decimals);
      if (this._decimals) {
        warn("Db2 does not support Float with decimals. Plain `FLOAT` will be used instead.");
        this._length = void 0;
        this.options.length = void 0;
      }
      if (this._unsigned) {
        warn("Db2 does not support Float unsigned. `UNSIGNED` was removed.");
        this._unsigned = void 0;
      }
      if (this._zerofill) {
        warn("Db2 does not support Float zerofill. `ZEROFILL` was removed.");
        this._zerofill = void 0;
      }
    }
  }
  class ENUM extends BaseTypes.ENUM {
    toSql() {
      return "VARCHAR(255)";
    }
  }
  class DOUBLE extends BaseTypes.DOUBLE {
    constructor(length, decimals) {
      super(length, decimals);
      if (this._length || this.options.length > 0 || this._unsigned || this._zerofill) {
        warn("db2 does not support DOUBLE with options. Plain DOUBLE will be used instead.");
        this._length = void 0;
        this.options.length = void 0;
        this._unsigned = void 0;
        this._zerofill = void 0;
      }
    }
    toSql() {
      return "DOUBLE";
    }
  }
  DOUBLE.prototype.key = DOUBLE.key = "DOUBLE";
  return {
    BLOB,
    BOOLEAN,
    ENUM,
    STRING,
    UUID,
    DATE,
    DATEONLY,
    NOW,
    TINYINT,
    SMALLINT,
    INTEGER,
    DOUBLE,
    "DOUBLE PRECISION": DOUBLE,
    BIGINT,
    REAL,
    FLOAT,
    TEXT
  };
};
//# sourceMappingURL=data-types.js.map