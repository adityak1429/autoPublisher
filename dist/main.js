"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports2, module2) {
    module2.exports = {
      name: "dotenv",
      version: "16.5.0",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      const vaultPath = _vaultPath(options);
      const result = DotenvModule.configDotenv({ path: vaultPath });
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.log(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = Boolean(options && options.debug);
      if (debug) {
        _debug("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config2(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config: config2,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// node_modules/diff/libcjs/diff/base.js
var require_base = __commonJS({
  "node_modules/diff/libcjs/diff/base.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Diff = (
      /** @class */
      function() {
        function Diff2() {
        }
        Diff2.prototype.diff = function(oldStr, newStr, options) {
          if (options === void 0) {
            options = {};
          }
          var callback;
          if (typeof options === "function") {
            callback = options;
            options = {};
          } else if ("callback" in options) {
            callback = options.callback;
          }
          var oldString = this.castInput(oldStr, options);
          var newString = this.castInput(newStr, options);
          var oldTokens = this.removeEmpty(this.tokenize(oldString, options));
          var newTokens = this.removeEmpty(this.tokenize(newString, options));
          return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
        };
        Diff2.prototype.diffWithOptionsObj = function(oldTokens, newTokens, options, callback) {
          var _this = this;
          var _a;
          var done = function(value) {
            value = _this.postProcess(value, options);
            if (callback) {
              setTimeout(function() {
                callback(value);
              }, 0);
              return void 0;
            } else {
              return value;
            }
          };
          var newLen = newTokens.length, oldLen = oldTokens.length;
          var editLength = 1;
          var maxEditLength = newLen + oldLen;
          if (options.maxEditLength != null) {
            maxEditLength = Math.min(maxEditLength, options.maxEditLength);
          }
          var maxExecutionTime = (_a = options.timeout) !== null && _a !== void 0 ? _a : Infinity;
          var abortAfterTimestamp = Date.now() + maxExecutionTime;
          var bestPath = [{ oldPos: -1, lastComponent: void 0 }];
          var newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
          if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
            return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
          }
          var minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
          var execEditLength = function() {
            for (var diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
              var basePath = void 0;
              var removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
              if (removePath) {
                bestPath[diagonalPath - 1] = void 0;
              }
              var canAdd = false;
              if (addPath) {
                var addPathNewPos = addPath.oldPos - diagonalPath;
                canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
              }
              var canRemove = removePath && removePath.oldPos + 1 < oldLen;
              if (!canAdd && !canRemove) {
                bestPath[diagonalPath] = void 0;
                continue;
              }
              if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
                basePath = _this.addToPath(addPath, true, false, 0, options);
              } else {
                basePath = _this.addToPath(removePath, false, true, 1, options);
              }
              newPos = _this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
              if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
                return done(_this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
              } else {
                bestPath[diagonalPath] = basePath;
                if (basePath.oldPos + 1 >= oldLen) {
                  maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
                }
                if (newPos + 1 >= newLen) {
                  minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
                }
              }
            }
            editLength++;
          };
          if (callback) {
            (function exec2() {
              setTimeout(function() {
                if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
                  return callback(void 0);
                }
                if (!execEditLength()) {
                  exec2();
                }
              }, 0);
            })();
          } else {
            while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
              var ret = execEditLength();
              if (ret) {
                return ret;
              }
            }
          }
        };
        Diff2.prototype.addToPath = function(path, added, removed, oldPosInc, options) {
          var last = path.lastComponent;
          if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
            return {
              oldPos: path.oldPos + oldPosInc,
              lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
            };
          } else {
            return {
              oldPos: path.oldPos + oldPosInc,
              lastComponent: { count: 1, added, removed, previousComponent: last }
            };
          }
        };
        Diff2.prototype.extractCommon = function(basePath, newTokens, oldTokens, diagonalPath, options) {
          var newLen = newTokens.length, oldLen = oldTokens.length;
          var oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
          while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
            newPos++;
            oldPos++;
            commonCount++;
            if (options.oneChangePerToken) {
              basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
            }
          }
          if (commonCount && !options.oneChangePerToken) {
            basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
          }
          basePath.oldPos = oldPos;
          return newPos;
        };
        Diff2.prototype.equals = function(left, right, options) {
          if (options.comparator) {
            return options.comparator(left, right);
          } else {
            return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
          }
        };
        Diff2.prototype.removeEmpty = function(array) {
          var ret = [];
          for (var i = 0; i < array.length; i++) {
            if (array[i]) {
              ret.push(array[i]);
            }
          }
          return ret;
        };
        Diff2.prototype.castInput = function(value, options) {
          return value;
        };
        Diff2.prototype.tokenize = function(value, options) {
          return Array.from(value);
        };
        Diff2.prototype.join = function(chars) {
          return chars.join("");
        };
        Diff2.prototype.postProcess = function(changeObjects, options) {
          return changeObjects;
        };
        Object.defineProperty(Diff2.prototype, "useLongestToken", {
          get: function() {
            return false;
          },
          enumerable: false,
          configurable: true
        });
        Diff2.prototype.buildValues = function(lastComponent, newTokens, oldTokens) {
          var components = [];
          var nextComponent;
          while (lastComponent) {
            components.push(lastComponent);
            nextComponent = lastComponent.previousComponent;
            delete lastComponent.previousComponent;
            lastComponent = nextComponent;
          }
          components.reverse();
          var componentLen = components.length;
          var componentPos = 0, newPos = 0, oldPos = 0;
          for (; componentPos < componentLen; componentPos++) {
            var component = components[componentPos];
            if (!component.removed) {
              if (!component.added && this.useLongestToken) {
                var value = newTokens.slice(newPos, newPos + component.count);
                value = value.map(function(value2, i) {
                  var oldValue = oldTokens[oldPos + i];
                  return oldValue.length > value2.length ? oldValue : value2;
                });
                component.value = this.join(value);
              } else {
                component.value = this.join(newTokens.slice(newPos, newPos + component.count));
              }
              newPos += component.count;
              if (!component.added) {
                oldPos += component.count;
              }
            } else {
              component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
              oldPos += component.count;
            }
          }
          return components;
        };
        return Diff2;
      }()
    );
    exports2.default = Diff;
  }
});

// node_modules/diff/libcjs/diff/character.js
var require_character = __commonJS({
  "node_modules/diff/libcjs/diff/character.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.characterDiff = void 0;
    exports2.diffChars = diffChars;
    var base_js_1 = require_base();
    var CharacterDiff = (
      /** @class */
      function(_super) {
        __extends(CharacterDiff2, _super);
        function CharacterDiff2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        return CharacterDiff2;
      }(base_js_1.default)
    );
    exports2.characterDiff = new CharacterDiff();
    function diffChars(oldStr, newStr, options) {
      return exports2.characterDiff.diff(oldStr, newStr, options);
    }
  }
});

// node_modules/diff/libcjs/util/string.js
var require_string = __commonJS({
  "node_modules/diff/libcjs/util/string.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.longestCommonPrefix = longestCommonPrefix;
    exports2.longestCommonSuffix = longestCommonSuffix;
    exports2.replacePrefix = replacePrefix;
    exports2.replaceSuffix = replaceSuffix;
    exports2.removePrefix = removePrefix;
    exports2.removeSuffix = removeSuffix;
    exports2.maximumOverlap = maximumOverlap;
    exports2.hasOnlyWinLineEndings = hasOnlyWinLineEndings;
    exports2.hasOnlyUnixLineEndings = hasOnlyUnixLineEndings;
    exports2.trailingWs = trailingWs;
    exports2.leadingWs = leadingWs;
    function longestCommonPrefix(str1, str2) {
      var i;
      for (i = 0; i < str1.length && i < str2.length; i++) {
        if (str1[i] != str2[i]) {
          return str1.slice(0, i);
        }
      }
      return str1.slice(0, i);
    }
    function longestCommonSuffix(str1, str2) {
      var i;
      if (!str1 || !str2 || str1[str1.length - 1] != str2[str2.length - 1]) {
        return "";
      }
      for (i = 0; i < str1.length && i < str2.length; i++) {
        if (str1[str1.length - (i + 1)] != str2[str2.length - (i + 1)]) {
          return str1.slice(-i);
        }
      }
      return str1.slice(-i);
    }
    function replacePrefix(string, oldPrefix, newPrefix) {
      if (string.slice(0, oldPrefix.length) != oldPrefix) {
        throw Error("string ".concat(JSON.stringify(string), " doesn't start with prefix ").concat(JSON.stringify(oldPrefix), "; this is a bug"));
      }
      return newPrefix + string.slice(oldPrefix.length);
    }
    function replaceSuffix(string, oldSuffix, newSuffix) {
      if (!oldSuffix) {
        return string + newSuffix;
      }
      if (string.slice(-oldSuffix.length) != oldSuffix) {
        throw Error("string ".concat(JSON.stringify(string), " doesn't end with suffix ").concat(JSON.stringify(oldSuffix), "; this is a bug"));
      }
      return string.slice(0, -oldSuffix.length) + newSuffix;
    }
    function removePrefix(string, oldPrefix) {
      return replacePrefix(string, oldPrefix, "");
    }
    function removeSuffix(string, oldSuffix) {
      return replaceSuffix(string, oldSuffix, "");
    }
    function maximumOverlap(string1, string2) {
      return string2.slice(0, overlapCount(string1, string2));
    }
    function overlapCount(a, b) {
      var startA = 0;
      if (a.length > b.length) {
        startA = a.length - b.length;
      }
      var endB = b.length;
      if (a.length < b.length) {
        endB = a.length;
      }
      var map = Array(endB);
      var k = 0;
      map[0] = 0;
      for (var j = 1; j < endB; j++) {
        if (b[j] == b[k]) {
          map[j] = map[k];
        } else {
          map[j] = k;
        }
        while (k > 0 && b[j] != b[k]) {
          k = map[k];
        }
        if (b[j] == b[k]) {
          k++;
        }
      }
      k = 0;
      for (var i = startA; i < a.length; i++) {
        while (k > 0 && a[i] != b[k]) {
          k = map[k];
        }
        if (a[i] == b[k]) {
          k++;
        }
      }
      return k;
    }
    function hasOnlyWinLineEndings(string) {
      return string.includes("\r\n") && !string.startsWith("\n") && !string.match(/[^\r]\n/);
    }
    function hasOnlyUnixLineEndings(string) {
      return !string.includes("\r\n") && string.includes("\n");
    }
    function trailingWs(string) {
      var i;
      for (i = string.length - 1; i >= 0; i--) {
        if (!string[i].match(/\s/)) {
          break;
        }
      }
      return string.substring(i + 1);
    }
    function leadingWs(string) {
      var match = string.match(/^\s*/);
      return match ? match[0] : "";
    }
  }
});

// node_modules/diff/libcjs/diff/word.js
var require_word = __commonJS({
  "node_modules/diff/libcjs/diff/word.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.wordsWithSpaceDiff = exports2.wordDiff = void 0;
    exports2.diffWords = diffWords;
    exports2.diffWordsWithSpace = diffWordsWithSpace;
    var base_js_1 = require_base();
    var string_js_1 = require_string();
    var extendedWordChars = "a-zA-Z0-9_\\u{C0}-\\u{FF}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}";
    var tokenizeIncludingWhitespace = new RegExp("[".concat(extendedWordChars, "]+|\\s+|[^").concat(extendedWordChars, "]"), "ug");
    var WordDiff = (
      /** @class */
      function(_super) {
        __extends(WordDiff2, _super);
        function WordDiff2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        WordDiff2.prototype.equals = function(left, right, options) {
          if (options.ignoreCase) {
            left = left.toLowerCase();
            right = right.toLowerCase();
          }
          return left.trim() === right.trim();
        };
        WordDiff2.prototype.tokenize = function(value, options) {
          if (options === void 0) {
            options = {};
          }
          var parts;
          if (options.intlSegmenter) {
            var segmenter = options.intlSegmenter;
            if (segmenter.resolvedOptions().granularity != "word") {
              throw new Error('The segmenter passed must have a granularity of "word"');
            }
            parts = Array.from(segmenter.segment(value), function(segment) {
              return segment.segment;
            });
          } else {
            parts = value.match(tokenizeIncludingWhitespace) || [];
          }
          var tokens = [];
          var prevPart = null;
          parts.forEach(function(part) {
            if (/\s/.test(part)) {
              if (prevPart == null) {
                tokens.push(part);
              } else {
                tokens.push(tokens.pop() + part);
              }
            } else if (prevPart != null && /\s/.test(prevPart)) {
              if (tokens[tokens.length - 1] == prevPart) {
                tokens.push(tokens.pop() + part);
              } else {
                tokens.push(prevPart + part);
              }
            } else {
              tokens.push(part);
            }
            prevPart = part;
          });
          return tokens;
        };
        WordDiff2.prototype.join = function(tokens) {
          return tokens.map(function(token, i) {
            if (i == 0) {
              return token;
            } else {
              return token.replace(/^\s+/, "");
            }
          }).join("");
        };
        WordDiff2.prototype.postProcess = function(changes, options) {
          if (!changes || options.oneChangePerToken) {
            return changes;
          }
          var lastKeep = null;
          var insertion = null;
          var deletion = null;
          changes.forEach(function(change) {
            if (change.added) {
              insertion = change;
            } else if (change.removed) {
              deletion = change;
            } else {
              if (insertion || deletion) {
                dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, change);
              }
              lastKeep = change;
              insertion = null;
              deletion = null;
            }
          });
          if (insertion || deletion) {
            dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, null);
          }
          return changes;
        };
        return WordDiff2;
      }(base_js_1.default)
    );
    exports2.wordDiff = new WordDiff();
    function diffWords(oldStr, newStr, options) {
      if ((options === null || options === void 0 ? void 0 : options.ignoreWhitespace) != null && !options.ignoreWhitespace) {
        return diffWordsWithSpace(oldStr, newStr, options);
      }
      return exports2.wordDiff.diff(oldStr, newStr, options);
    }
    function dedupeWhitespaceInChangeObjects(startKeep, deletion, insertion, endKeep) {
      if (deletion && insertion) {
        var oldWsPrefix = (0, string_js_1.leadingWs)(deletion.value);
        var oldWsSuffix = (0, string_js_1.trailingWs)(deletion.value);
        var newWsPrefix = (0, string_js_1.leadingWs)(insertion.value);
        var newWsSuffix = (0, string_js_1.trailingWs)(insertion.value);
        if (startKeep) {
          var commonWsPrefix = (0, string_js_1.longestCommonPrefix)(oldWsPrefix, newWsPrefix);
          startKeep.value = (0, string_js_1.replaceSuffix)(startKeep.value, newWsPrefix, commonWsPrefix);
          deletion.value = (0, string_js_1.removePrefix)(deletion.value, commonWsPrefix);
          insertion.value = (0, string_js_1.removePrefix)(insertion.value, commonWsPrefix);
        }
        if (endKeep) {
          var commonWsSuffix = (0, string_js_1.longestCommonSuffix)(oldWsSuffix, newWsSuffix);
          endKeep.value = (0, string_js_1.replacePrefix)(endKeep.value, newWsSuffix, commonWsSuffix);
          deletion.value = (0, string_js_1.removeSuffix)(deletion.value, commonWsSuffix);
          insertion.value = (0, string_js_1.removeSuffix)(insertion.value, commonWsSuffix);
        }
      } else if (insertion) {
        if (startKeep) {
          var ws = (0, string_js_1.leadingWs)(insertion.value);
          insertion.value = insertion.value.substring(ws.length);
        }
        if (endKeep) {
          var ws = (0, string_js_1.leadingWs)(endKeep.value);
          endKeep.value = endKeep.value.substring(ws.length);
        }
      } else if (startKeep && endKeep) {
        var newWsFull = (0, string_js_1.leadingWs)(endKeep.value), delWsStart = (0, string_js_1.leadingWs)(deletion.value), delWsEnd = (0, string_js_1.trailingWs)(deletion.value);
        var newWsStart = (0, string_js_1.longestCommonPrefix)(newWsFull, delWsStart);
        deletion.value = (0, string_js_1.removePrefix)(deletion.value, newWsStart);
        var newWsEnd = (0, string_js_1.longestCommonSuffix)((0, string_js_1.removePrefix)(newWsFull, newWsStart), delWsEnd);
        deletion.value = (0, string_js_1.removeSuffix)(deletion.value, newWsEnd);
        endKeep.value = (0, string_js_1.replacePrefix)(endKeep.value, newWsFull, newWsEnd);
        startKeep.value = (0, string_js_1.replaceSuffix)(startKeep.value, newWsFull, newWsFull.slice(0, newWsFull.length - newWsEnd.length));
      } else if (endKeep) {
        var endKeepWsPrefix = (0, string_js_1.leadingWs)(endKeep.value);
        var deletionWsSuffix = (0, string_js_1.trailingWs)(deletion.value);
        var overlap = (0, string_js_1.maximumOverlap)(deletionWsSuffix, endKeepWsPrefix);
        deletion.value = (0, string_js_1.removeSuffix)(deletion.value, overlap);
      } else if (startKeep) {
        var startKeepWsSuffix = (0, string_js_1.trailingWs)(startKeep.value);
        var deletionWsPrefix = (0, string_js_1.leadingWs)(deletion.value);
        var overlap = (0, string_js_1.maximumOverlap)(startKeepWsSuffix, deletionWsPrefix);
        deletion.value = (0, string_js_1.removePrefix)(deletion.value, overlap);
      }
    }
    var WordsWithSpaceDiff = (
      /** @class */
      function(_super) {
        __extends(WordsWithSpaceDiff2, _super);
        function WordsWithSpaceDiff2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        WordsWithSpaceDiff2.prototype.tokenize = function(value) {
          var regex = new RegExp("(\\r?\\n)|[".concat(extendedWordChars, "]+|[^\\S\\n\\r]+|[^").concat(extendedWordChars, "]"), "ug");
          return value.match(regex) || [];
        };
        return WordsWithSpaceDiff2;
      }(base_js_1.default)
    );
    exports2.wordsWithSpaceDiff = new WordsWithSpaceDiff();
    function diffWordsWithSpace(oldStr, newStr, options) {
      return exports2.wordsWithSpaceDiff.diff(oldStr, newStr, options);
    }
  }
});

// node_modules/diff/libcjs/util/params.js
var require_params = __commonJS({
  "node_modules/diff/libcjs/util/params.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.generateOptions = generateOptions;
    function generateOptions(options, defaults) {
      if (typeof options === "function") {
        defaults.callback = options;
      } else if (options) {
        for (var name in options) {
          if (Object.prototype.hasOwnProperty.call(options, name)) {
            defaults[name] = options[name];
          }
        }
      }
      return defaults;
    }
  }
});

// node_modules/diff/libcjs/diff/line.js
var require_line = __commonJS({
  "node_modules/diff/libcjs/diff/line.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.lineDiff = void 0;
    exports2.diffLines = diffLines;
    exports2.diffTrimmedLines = diffTrimmedLines;
    exports2.tokenize = tokenize;
    var base_js_1 = require_base();
    var params_js_1 = require_params();
    var LineDiff = (
      /** @class */
      function(_super) {
        __extends(LineDiff2, _super);
        function LineDiff2() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.tokenize = tokenize;
          return _this;
        }
        LineDiff2.prototype.equals = function(left, right, options) {
          if (options.ignoreWhitespace) {
            if (!options.newlineIsToken || !left.includes("\n")) {
              left = left.trim();
            }
            if (!options.newlineIsToken || !right.includes("\n")) {
              right = right.trim();
            }
          } else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
            if (left.endsWith("\n")) {
              left = left.slice(0, -1);
            }
            if (right.endsWith("\n")) {
              right = right.slice(0, -1);
            }
          }
          return _super.prototype.equals.call(this, left, right, options);
        };
        return LineDiff2;
      }(base_js_1.default)
    );
    exports2.lineDiff = new LineDiff();
    function diffLines(oldStr, newStr, options) {
      return exports2.lineDiff.diff(oldStr, newStr, options);
    }
    function diffTrimmedLines(oldStr, newStr, options) {
      options = (0, params_js_1.generateOptions)(options, { ignoreWhitespace: true });
      return exports2.lineDiff.diff(oldStr, newStr, options);
    }
    function tokenize(value, options) {
      if (options.stripTrailingCr) {
        value = value.replace(/\r\n/g, "\n");
      }
      var retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
      if (!linesAndNewlines[linesAndNewlines.length - 1]) {
        linesAndNewlines.pop();
      }
      for (var i = 0; i < linesAndNewlines.length; i++) {
        var line = linesAndNewlines[i];
        if (i % 2 && !options.newlineIsToken) {
          retLines[retLines.length - 1] += line;
        } else {
          retLines.push(line);
        }
      }
      return retLines;
    }
  }
});

// node_modules/diff/libcjs/diff/sentence.js
var require_sentence = __commonJS({
  "node_modules/diff/libcjs/diff/sentence.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sentenceDiff = void 0;
    exports2.diffSentences = diffSentences;
    var base_js_1 = require_base();
    function isSentenceEndPunct(char) {
      return char == "." || char == "!" || char == "?";
    }
    var SentenceDiff = (
      /** @class */
      function(_super) {
        __extends(SentenceDiff2, _super);
        function SentenceDiff2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        SentenceDiff2.prototype.tokenize = function(value) {
          var _a;
          var result = [];
          var tokenStartI = 0;
          for (var i = 0; i < value.length; i++) {
            if (i == value.length - 1) {
              result.push(value.slice(tokenStartI));
              break;
            }
            if (isSentenceEndPunct(value[i]) && value[i + 1].match(/\s/)) {
              result.push(value.slice(tokenStartI, i + 1));
              i = tokenStartI = i + 1;
              while ((_a = value[i + 1]) === null || _a === void 0 ? void 0 : _a.match(/\s/)) {
                i++;
              }
              result.push(value.slice(tokenStartI, i + 1));
              tokenStartI = i + 1;
            }
          }
          return result;
        };
        return SentenceDiff2;
      }(base_js_1.default)
    );
    exports2.sentenceDiff = new SentenceDiff();
    function diffSentences(oldStr, newStr, options) {
      return exports2.sentenceDiff.diff(oldStr, newStr, options);
    }
  }
});

// node_modules/diff/libcjs/diff/css.js
var require_css = __commonJS({
  "node_modules/diff/libcjs/diff/css.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.cssDiff = void 0;
    exports2.diffCss = diffCss;
    var base_js_1 = require_base();
    var CssDiff = (
      /** @class */
      function(_super) {
        __extends(CssDiff2, _super);
        function CssDiff2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        CssDiff2.prototype.tokenize = function(value) {
          return value.split(/([{}:;,]|\s+)/);
        };
        return CssDiff2;
      }(base_js_1.default)
    );
    exports2.cssDiff = new CssDiff();
    function diffCss(oldStr, newStr, options) {
      return exports2.cssDiff.diff(oldStr, newStr, options);
    }
  }
});

// node_modules/diff/libcjs/diff/json.js
var require_json = __commonJS({
  "node_modules/diff/libcjs/diff/json.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.jsonDiff = void 0;
    exports2.diffJson = diffJson;
    exports2.canonicalize = canonicalize;
    var base_js_1 = require_base();
    var line_js_1 = require_line();
    var JsonDiff = (
      /** @class */
      function(_super) {
        __extends(JsonDiff2, _super);
        function JsonDiff2() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.tokenize = line_js_1.tokenize;
          return _this;
        }
        Object.defineProperty(JsonDiff2.prototype, "useLongestToken", {
          get: function() {
            return true;
          },
          enumerable: false,
          configurable: true
        });
        JsonDiff2.prototype.castInput = function(value, options) {
          var undefinedReplacement = options.undefinedReplacement, _a = options.stringifyReplacer, stringifyReplacer = _a === void 0 ? function(k, v) {
            return typeof v === "undefined" ? undefinedReplacement : v;
          } : _a;
          return typeof value === "string" ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), null, "  ");
        };
        JsonDiff2.prototype.equals = function(left, right, options) {
          return _super.prototype.equals.call(this, left.replace(/,([\r\n])/g, "$1"), right.replace(/,([\r\n])/g, "$1"), options);
        };
        return JsonDiff2;
      }(base_js_1.default)
    );
    exports2.jsonDiff = new JsonDiff();
    function diffJson(oldStr, newStr, options) {
      return exports2.jsonDiff.diff(oldStr, newStr, options);
    }
    function canonicalize(obj, stack, replacementStack, replacer, key) {
      stack = stack || [];
      replacementStack = replacementStack || [];
      if (replacer) {
        obj = replacer(key === void 0 ? "" : key, obj);
      }
      var i;
      for (i = 0; i < stack.length; i += 1) {
        if (stack[i] === obj) {
          return replacementStack[i];
        }
      }
      var canonicalizedObj;
      if ("[object Array]" === Object.prototype.toString.call(obj)) {
        stack.push(obj);
        canonicalizedObj = new Array(obj.length);
        replacementStack.push(canonicalizedObj);
        for (i = 0; i < obj.length; i += 1) {
          canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, String(i));
        }
        stack.pop();
        replacementStack.pop();
        return canonicalizedObj;
      }
      if (obj && obj.toJSON) {
        obj = obj.toJSON();
      }
      if (typeof obj === "object" && obj !== null) {
        stack.push(obj);
        canonicalizedObj = {};
        replacementStack.push(canonicalizedObj);
        var sortedKeys = [];
        var key_1;
        for (key_1 in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key_1)) {
            sortedKeys.push(key_1);
          }
        }
        sortedKeys.sort();
        for (i = 0; i < sortedKeys.length; i += 1) {
          key_1 = sortedKeys[i];
          canonicalizedObj[key_1] = canonicalize(obj[key_1], stack, replacementStack, replacer, key_1);
        }
        stack.pop();
        replacementStack.pop();
      } else {
        canonicalizedObj = obj;
      }
      return canonicalizedObj;
    }
  }
});

// node_modules/diff/libcjs/diff/array.js
var require_array = __commonJS({
  "node_modules/diff/libcjs/diff/array.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.arrayDiff = void 0;
    exports2.diffArrays = diffArrays;
    var base_js_1 = require_base();
    var ArrayDiff = (
      /** @class */
      function(_super) {
        __extends(ArrayDiff2, _super);
        function ArrayDiff2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ArrayDiff2.prototype.tokenize = function(value) {
          return value.slice();
        };
        ArrayDiff2.prototype.join = function(value) {
          return value;
        };
        ArrayDiff2.prototype.removeEmpty = function(value) {
          return value;
        };
        return ArrayDiff2;
      }(base_js_1.default)
    );
    exports2.arrayDiff = new ArrayDiff();
    function diffArrays(oldArr, newArr, options) {
      return exports2.arrayDiff.diff(oldArr, newArr, options);
    }
  }
});

// node_modules/diff/libcjs/patch/line-endings.js
var require_line_endings = __commonJS({
  "node_modules/diff/libcjs/patch/line-endings.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.unixToWin = unixToWin;
    exports2.winToUnix = winToUnix;
    exports2.isUnix = isUnix;
    exports2.isWin = isWin;
    function unixToWin(patch) {
      if (Array.isArray(patch)) {
        return patch.map(function(p) {
          return unixToWin(p);
        });
      }
      return __assign(__assign({}, patch), { hunks: patch.hunks.map(function(hunk) {
        return __assign(__assign({}, hunk), { lines: hunk.lines.map(function(line, i) {
          var _a;
          return line.startsWith("\\") || line.endsWith("\r") || ((_a = hunk.lines[i + 1]) === null || _a === void 0 ? void 0 : _a.startsWith("\\")) ? line : line + "\r";
        }) });
      }) });
    }
    function winToUnix(patch) {
      if (Array.isArray(patch)) {
        return patch.map(function(p) {
          return winToUnix(p);
        });
      }
      return __assign(__assign({}, patch), { hunks: patch.hunks.map(function(hunk) {
        return __assign(__assign({}, hunk), { lines: hunk.lines.map(function(line) {
          return line.endsWith("\r") ? line.substring(0, line.length - 1) : line;
        }) });
      }) });
    }
    function isUnix(patch) {
      if (!Array.isArray(patch)) {
        patch = [patch];
      }
      return !patch.some(function(index) {
        return index.hunks.some(function(hunk) {
          return hunk.lines.some(function(line) {
            return !line.startsWith("\\") && line.endsWith("\r");
          });
        });
      });
    }
    function isWin(patch) {
      if (!Array.isArray(patch)) {
        patch = [patch];
      }
      return patch.some(function(index) {
        return index.hunks.some(function(hunk) {
          return hunk.lines.some(function(line) {
            return line.endsWith("\r");
          });
        });
      }) && patch.every(function(index) {
        return index.hunks.every(function(hunk) {
          return hunk.lines.every(function(line, i) {
            var _a;
            return line.startsWith("\\") || line.endsWith("\r") || ((_a = hunk.lines[i + 1]) === null || _a === void 0 ? void 0 : _a.startsWith("\\"));
          });
        });
      });
    }
  }
});

// node_modules/diff/libcjs/patch/parse.js
var require_parse = __commonJS({
  "node_modules/diff/libcjs/patch/parse.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parsePatch = parsePatch;
    function parsePatch(uniDiff) {
      var diffstr = uniDiff.split(/\n/), list = [];
      var i = 0;
      function parseIndex() {
        var index = {};
        list.push(index);
        while (i < diffstr.length) {
          var line = diffstr[i];
          if (/^(---|\+\+\+|@@)\s/.test(line)) {
            break;
          }
          var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);
          if (header) {
            index.index = header[1];
          }
          i++;
        }
        parseFileHeader(index);
        parseFileHeader(index);
        index.hunks = [];
        while (i < diffstr.length) {
          var line = diffstr[i];
          if (/^(Index:\s|diff\s|---\s|\+\+\+\s|===================================================================)/.test(line)) {
            break;
          } else if (/^@@/.test(line)) {
            index.hunks.push(parseHunk());
          } else if (line) {
            throw new Error("Unknown line " + (i + 1) + " " + JSON.stringify(line));
          } else {
            i++;
          }
        }
      }
      function parseFileHeader(index) {
        var fileHeader = /^(---|\+\+\+)\s+(.*)\r?$/.exec(diffstr[i]);
        if (fileHeader) {
          var data = fileHeader[2].split("	", 2), header = (data[1] || "").trim();
          var fileName = data[0].replace(/\\\\/g, "\\");
          if (/^".*"$/.test(fileName)) {
            fileName = fileName.substr(1, fileName.length - 2);
          }
          if (fileHeader[1] === "---") {
            index.oldFileName = fileName;
            index.oldHeader = header;
          } else {
            index.newFileName = fileName;
            index.newHeader = header;
          }
          i++;
        }
      }
      function parseHunk() {
        var _a;
        var chunkHeaderIndex = i, chunkHeaderLine = diffstr[i++], chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        var hunk = {
          oldStart: +chunkHeader[1],
          oldLines: typeof chunkHeader[2] === "undefined" ? 1 : +chunkHeader[2],
          newStart: +chunkHeader[3],
          newLines: typeof chunkHeader[4] === "undefined" ? 1 : +chunkHeader[4],
          lines: []
        };
        if (hunk.oldLines === 0) {
          hunk.oldStart += 1;
        }
        if (hunk.newLines === 0) {
          hunk.newStart += 1;
        }
        var addCount = 0, removeCount = 0;
        for (; i < diffstr.length && (removeCount < hunk.oldLines || addCount < hunk.newLines || ((_a = diffstr[i]) === null || _a === void 0 ? void 0 : _a.startsWith("\\"))); i++) {
          var operation = diffstr[i].length == 0 && i != diffstr.length - 1 ? " " : diffstr[i][0];
          if (operation === "+" || operation === "-" || operation === " " || operation === "\\") {
            hunk.lines.push(diffstr[i]);
            if (operation === "+") {
              addCount++;
            } else if (operation === "-") {
              removeCount++;
            } else if (operation === " ") {
              addCount++;
              removeCount++;
            }
          } else {
            throw new Error("Hunk at line ".concat(chunkHeaderIndex + 1, " contained invalid line ").concat(diffstr[i]));
          }
        }
        if (!addCount && hunk.newLines === 1) {
          hunk.newLines = 0;
        }
        if (!removeCount && hunk.oldLines === 1) {
          hunk.oldLines = 0;
        }
        if (addCount !== hunk.newLines) {
          throw new Error("Added line count did not match for hunk at line " + (chunkHeaderIndex + 1));
        }
        if (removeCount !== hunk.oldLines) {
          throw new Error("Removed line count did not match for hunk at line " + (chunkHeaderIndex + 1));
        }
        return hunk;
      }
      while (i < diffstr.length) {
        parseIndex();
      }
      return list;
    }
  }
});

// node_modules/diff/libcjs/util/distance-iterator.js
var require_distance_iterator = __commonJS({
  "node_modules/diff/libcjs/util/distance-iterator.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    function default_1(start, minLine, maxLine) {
      var wantForward = true, backwardExhausted = false, forwardExhausted = false, localOffset = 1;
      return function iterator() {
        if (wantForward && !forwardExhausted) {
          if (backwardExhausted) {
            localOffset++;
          } else {
            wantForward = false;
          }
          if (start + localOffset <= maxLine) {
            return start + localOffset;
          }
          forwardExhausted = true;
        }
        if (!backwardExhausted) {
          if (!forwardExhausted) {
            wantForward = true;
          }
          if (minLine <= start - localOffset) {
            return start - localOffset++;
          }
          backwardExhausted = true;
          return iterator();
        }
        return void 0;
      };
    }
  }
});

// node_modules/diff/libcjs/patch/apply.js
var require_apply = __commonJS({
  "node_modules/diff/libcjs/patch/apply.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.applyPatch = applyPatch;
    exports2.applyPatches = applyPatches;
    var string_js_1 = require_string();
    var line_endings_js_1 = require_line_endings();
    var parse_js_1 = require_parse();
    var distance_iterator_js_1 = require_distance_iterator();
    function applyPatch(source, patch, options) {
      if (options === void 0) {
        options = {};
      }
      var patches;
      if (typeof patch === "string") {
        patches = (0, parse_js_1.parsePatch)(patch);
      } else if (Array.isArray(patch)) {
        patches = patch;
      } else {
        patches = [patch];
      }
      if (patches.length > 1) {
        throw new Error("applyPatch only works with a single input.");
      }
      return applyStructuredPatch(source, patches[0], options);
    }
    function applyStructuredPatch(source, patch, options) {
      if (options === void 0) {
        options = {};
      }
      if (options.autoConvertLineEndings || options.autoConvertLineEndings == null) {
        if ((0, string_js_1.hasOnlyWinLineEndings)(source) && (0, line_endings_js_1.isUnix)(patch)) {
          patch = (0, line_endings_js_1.unixToWin)(patch);
        } else if ((0, string_js_1.hasOnlyUnixLineEndings)(source) && (0, line_endings_js_1.isWin)(patch)) {
          patch = (0, line_endings_js_1.winToUnix)(patch);
        }
      }
      var lines = source.split("\n"), hunks = patch.hunks, compareLine = options.compareLine || function(lineNumber, line2, operation, patchContent) {
        return line2 === patchContent;
      }, fuzzFactor = options.fuzzFactor || 0;
      var minLine = 0;
      if (fuzzFactor < 0 || !Number.isInteger(fuzzFactor)) {
        throw new Error("fuzzFactor must be a non-negative integer");
      }
      if (!hunks.length) {
        return source;
      }
      var prevLine = "", removeEOFNL = false, addEOFNL = false;
      for (var i = 0; i < hunks[hunks.length - 1].lines.length; i++) {
        var line = hunks[hunks.length - 1].lines[i];
        if (line[0] == "\\") {
          if (prevLine[0] == "+") {
            removeEOFNL = true;
          } else if (prevLine[0] == "-") {
            addEOFNL = true;
          }
        }
        prevLine = line;
      }
      if (removeEOFNL) {
        if (addEOFNL) {
          if (!fuzzFactor && lines[lines.length - 1] == "") {
            return false;
          }
        } else if (lines[lines.length - 1] == "") {
          lines.pop();
        } else if (!fuzzFactor) {
          return false;
        }
      } else if (addEOFNL) {
        if (lines[lines.length - 1] != "") {
          lines.push("");
        } else if (!fuzzFactor) {
          return false;
        }
      }
      function applyHunk(hunkLines, toPos2, maxErrors2, hunkLinesI, lastContextLineMatched, patchedLines, patchedLinesLength) {
        if (hunkLinesI === void 0) {
          hunkLinesI = 0;
        }
        if (lastContextLineMatched === void 0) {
          lastContextLineMatched = true;
        }
        if (patchedLines === void 0) {
          patchedLines = [];
        }
        if (patchedLinesLength === void 0) {
          patchedLinesLength = 0;
        }
        var nConsecutiveOldContextLines = 0;
        var nextContextLineMustMatch = false;
        for (; hunkLinesI < hunkLines.length; hunkLinesI++) {
          var hunkLine = hunkLines[hunkLinesI], operation = hunkLine.length > 0 ? hunkLine[0] : " ", content = hunkLine.length > 0 ? hunkLine.substr(1) : hunkLine;
          if (operation === "-") {
            if (compareLine(toPos2 + 1, lines[toPos2], operation, content)) {
              toPos2++;
              nConsecutiveOldContextLines = 0;
            } else {
              if (!maxErrors2 || lines[toPos2] == null) {
                return null;
              }
              patchedLines[patchedLinesLength] = lines[toPos2];
              return applyHunk(hunkLines, toPos2 + 1, maxErrors2 - 1, hunkLinesI, false, patchedLines, patchedLinesLength + 1);
            }
          }
          if (operation === "+") {
            if (!lastContextLineMatched) {
              return null;
            }
            patchedLines[patchedLinesLength] = content;
            patchedLinesLength++;
            nConsecutiveOldContextLines = 0;
            nextContextLineMustMatch = true;
          }
          if (operation === " ") {
            nConsecutiveOldContextLines++;
            patchedLines[patchedLinesLength] = lines[toPos2];
            if (compareLine(toPos2 + 1, lines[toPos2], operation, content)) {
              patchedLinesLength++;
              lastContextLineMatched = true;
              nextContextLineMustMatch = false;
              toPos2++;
            } else {
              if (nextContextLineMustMatch || !maxErrors2) {
                return null;
              }
              return lines[toPos2] && (applyHunk(hunkLines, toPos2 + 1, maxErrors2 - 1, hunkLinesI + 1, false, patchedLines, patchedLinesLength + 1) || applyHunk(hunkLines, toPos2 + 1, maxErrors2 - 1, hunkLinesI, false, patchedLines, patchedLinesLength + 1)) || applyHunk(hunkLines, toPos2, maxErrors2 - 1, hunkLinesI + 1, false, patchedLines, patchedLinesLength);
            }
          }
        }
        patchedLinesLength -= nConsecutiveOldContextLines;
        toPos2 -= nConsecutiveOldContextLines;
        patchedLines.length = patchedLinesLength;
        return {
          patchedLines,
          oldLineLastI: toPos2 - 1
        };
      }
      var resultLines = [];
      var prevHunkOffset = 0;
      for (var i = 0; i < hunks.length; i++) {
        var hunk = hunks[i];
        var hunkResult = void 0;
        var maxLine = lines.length - hunk.oldLines + fuzzFactor;
        var toPos = void 0;
        for (var maxErrors = 0; maxErrors <= fuzzFactor; maxErrors++) {
          toPos = hunk.oldStart + prevHunkOffset - 1;
          var iterator = (0, distance_iterator_js_1.default)(toPos, minLine, maxLine);
          for (; toPos !== void 0; toPos = iterator()) {
            hunkResult = applyHunk(hunk.lines, toPos, maxErrors);
            if (hunkResult) {
              break;
            }
          }
          if (hunkResult) {
            break;
          }
        }
        if (!hunkResult) {
          return false;
        }
        for (var i_1 = minLine; i_1 < toPos; i_1++) {
          resultLines.push(lines[i_1]);
        }
        for (var i_2 = 0; i_2 < hunkResult.patchedLines.length; i_2++) {
          var line = hunkResult.patchedLines[i_2];
          resultLines.push(line);
        }
        minLine = hunkResult.oldLineLastI + 1;
        prevHunkOffset = toPos + 1 - hunk.oldStart;
      }
      for (var i = minLine; i < lines.length; i++) {
        resultLines.push(lines[i]);
      }
      return resultLines.join("\n");
    }
    function applyPatches(uniDiff, options) {
      var spDiff = typeof uniDiff === "string" ? (0, parse_js_1.parsePatch)(uniDiff) : uniDiff;
      var currentIndex = 0;
      function processIndex() {
        var index = spDiff[currentIndex++];
        if (!index) {
          return options.complete();
        }
        options.loadFile(index, function(err, data) {
          if (err) {
            return options.complete(err);
          }
          var updatedContent = applyPatch(data, index, options);
          options.patched(index, updatedContent, function(err2) {
            if (err2) {
              return options.complete(err2);
            }
            processIndex();
          });
        });
      }
      processIndex();
    }
  }
});

// node_modules/diff/libcjs/patch/reverse.js
var require_reverse = __commonJS({
  "node_modules/diff/libcjs/patch/reverse.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.reversePatch = reversePatch;
    function reversePatch(structuredPatch) {
      if (Array.isArray(structuredPatch)) {
        return structuredPatch.map(function(patch) {
          return reversePatch(patch);
        }).reverse();
      }
      return __assign(__assign({}, structuredPatch), { oldFileName: structuredPatch.newFileName, oldHeader: structuredPatch.newHeader, newFileName: structuredPatch.oldFileName, newHeader: structuredPatch.oldHeader, hunks: structuredPatch.hunks.map(function(hunk) {
        return {
          oldLines: hunk.newLines,
          oldStart: hunk.newStart,
          newLines: hunk.oldLines,
          newStart: hunk.oldStart,
          lines: hunk.lines.map(function(l) {
            if (l.startsWith("-")) {
              return "+".concat(l.slice(1));
            }
            if (l.startsWith("+")) {
              return "-".concat(l.slice(1));
            }
            return l;
          })
        };
      }) });
    }
  }
});

// node_modules/diff/libcjs/patch/create.js
var require_create = __commonJS({
  "node_modules/diff/libcjs/patch/create.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.structuredPatch = structuredPatch;
    exports2.formatPatch = formatPatch;
    exports2.createTwoFilesPatch = createTwoFilesPatch;
    exports2.createPatch = createPatch;
    var line_js_1 = require_line();
    function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
      var optionsObj;
      if (!options) {
        optionsObj = {};
      } else if (typeof options === "function") {
        optionsObj = { callback: options };
      } else {
        optionsObj = options;
      }
      if (typeof optionsObj.context === "undefined") {
        optionsObj.context = 4;
      }
      var context = optionsObj.context;
      if (optionsObj.newlineIsToken) {
        throw new Error("newlineIsToken may not be used with patch-generation functions, only with diffing functions");
      }
      if (!optionsObj.callback) {
        return diffLinesResultToPatch((0, line_js_1.diffLines)(oldStr, newStr, optionsObj));
      } else {
        var callback_1 = optionsObj.callback;
        (0, line_js_1.diffLines)(oldStr, newStr, __assign(__assign({}, optionsObj), { callback: function(diff2) {
          var patch = diffLinesResultToPatch(diff2);
          callback_1(patch);
        } }));
      }
      function diffLinesResultToPatch(diff2) {
        if (!diff2) {
          return;
        }
        diff2.push({ value: "", lines: [] });
        function contextLines(lines2) {
          return lines2.map(function(entry) {
            return " " + entry;
          });
        }
        var hunks = [];
        var oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
        for (var i = 0; i < diff2.length; i++) {
          var current = diff2[i], lines = current.lines || splitLines(current.value);
          current.lines = lines;
          if (current.added || current.removed) {
            if (!oldRangeStart) {
              var prev = diff2[i - 1];
              oldRangeStart = oldLine;
              newRangeStart = newLine;
              if (prev) {
                curRange = context > 0 ? contextLines(prev.lines.slice(-context)) : [];
                oldRangeStart -= curRange.length;
                newRangeStart -= curRange.length;
              }
            }
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
              var line = lines_1[_i];
              curRange.push((current.added ? "+" : "-") + line);
            }
            if (current.added) {
              newLine += lines.length;
            } else {
              oldLine += lines.length;
            }
          } else {
            if (oldRangeStart) {
              if (lines.length <= context * 2 && i < diff2.length - 2) {
                for (var _a = 0, _b = contextLines(lines); _a < _b.length; _a++) {
                  var line = _b[_a];
                  curRange.push(line);
                }
              } else {
                var contextSize = Math.min(lines.length, context);
                for (var _c = 0, _d = contextLines(lines.slice(0, contextSize)); _c < _d.length; _c++) {
                  var line = _d[_c];
                  curRange.push(line);
                }
                var hunk = {
                  oldStart: oldRangeStart,
                  oldLines: oldLine - oldRangeStart + contextSize,
                  newStart: newRangeStart,
                  newLines: newLine - newRangeStart + contextSize,
                  lines: curRange
                };
                hunks.push(hunk);
                oldRangeStart = 0;
                newRangeStart = 0;
                curRange = [];
              }
            }
            oldLine += lines.length;
            newLine += lines.length;
          }
        }
        for (var _e = 0, hunks_1 = hunks; _e < hunks_1.length; _e++) {
          var hunk = hunks_1[_e];
          for (var i = 0; i < hunk.lines.length; i++) {
            if (hunk.lines[i].endsWith("\n")) {
              hunk.lines[i] = hunk.lines[i].slice(0, -1);
            } else {
              hunk.lines.splice(i + 1, 0, "\\ No newline at end of file");
              i++;
            }
          }
        }
        return {
          oldFileName,
          newFileName,
          oldHeader,
          newHeader,
          hunks
        };
      }
    }
    function formatPatch(patch) {
      if (Array.isArray(patch)) {
        return patch.map(formatPatch).join("\n");
      }
      var ret = [];
      if (patch.oldFileName == patch.newFileName) {
        ret.push("Index: " + patch.oldFileName);
      }
      ret.push("===================================================================");
      ret.push("--- " + patch.oldFileName + (typeof patch.oldHeader === "undefined" ? "" : "	" + patch.oldHeader));
      ret.push("+++ " + patch.newFileName + (typeof patch.newHeader === "undefined" ? "" : "	" + patch.newHeader));
      for (var i = 0; i < patch.hunks.length; i++) {
        var hunk = patch.hunks[i];
        if (hunk.oldLines === 0) {
          hunk.oldStart -= 1;
        }
        if (hunk.newLines === 0) {
          hunk.newStart -= 1;
        }
        ret.push("@@ -" + hunk.oldStart + "," + hunk.oldLines + " +" + hunk.newStart + "," + hunk.newLines + " @@");
        for (var _i = 0, _a = hunk.lines; _i < _a.length; _i++) {
          var line = _a[_i];
          ret.push(line);
        }
      }
      return ret.join("\n") + "\n";
    }
    function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
      if (typeof options === "function") {
        options = { callback: options };
      }
      if (!(options === null || options === void 0 ? void 0 : options.callback)) {
        var patchObj = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
        if (!patchObj) {
          return;
        }
        return formatPatch(patchObj);
      } else {
        var callback_2 = options.callback;
        structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, __assign(__assign({}, options), { callback: function(patchObj2) {
          if (!patchObj2) {
            callback_2(void 0);
          } else {
            callback_2(formatPatch(patchObj2));
          }
        } }));
      }
    }
    function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
      return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
    }
    function splitLines(text) {
      var hasTrailingNl = text.endsWith("\n");
      var result = text.split("\n").map(function(line) {
        return line + "\n";
      });
      if (hasTrailingNl) {
        result.pop();
      } else {
        result.push(result.pop().slice(0, -1));
      }
      return result;
    }
  }
});

// node_modules/diff/libcjs/convert/dmp.js
var require_dmp = __commonJS({
  "node_modules/diff/libcjs/convert/dmp.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.convertChangesToDMP = convertChangesToDMP;
    function convertChangesToDMP(changes) {
      var ret = [];
      var change, operation;
      for (var i = 0; i < changes.length; i++) {
        change = changes[i];
        if (change.added) {
          operation = 1;
        } else if (change.removed) {
          operation = -1;
        } else {
          operation = 0;
        }
        ret.push([operation, change.value]);
      }
      return ret;
    }
  }
});

// node_modules/diff/libcjs/convert/xml.js
var require_xml = __commonJS({
  "node_modules/diff/libcjs/convert/xml.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.convertChangesToXML = convertChangesToXML;
    function convertChangesToXML(changes) {
      var ret = [];
      for (var i = 0; i < changes.length; i++) {
        var change = changes[i];
        if (change.added) {
          ret.push("<ins>");
        } else if (change.removed) {
          ret.push("<del>");
        }
        ret.push(escapeHTML(change.value));
        if (change.added) {
          ret.push("</ins>");
        } else if (change.removed) {
          ret.push("</del>");
        }
      }
      return ret.join("");
    }
    function escapeHTML(s) {
      var n = s;
      n = n.replace(/&/g, "&amp;");
      n = n.replace(/</g, "&lt;");
      n = n.replace(/>/g, "&gt;");
      n = n.replace(/"/g, "&quot;");
      return n;
    }
  }
});

// node_modules/diff/libcjs/index.js
var require_libcjs = __commonJS({
  "node_modules/diff/libcjs/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.canonicalize = exports2.convertChangesToXML = exports2.convertChangesToDMP = exports2.reversePatch = exports2.parsePatch = exports2.applyPatches = exports2.applyPatch = exports2.formatPatch = exports2.createPatch = exports2.createTwoFilesPatch = exports2.structuredPatch = exports2.arrayDiff = exports2.diffArrays = exports2.jsonDiff = exports2.diffJson = exports2.cssDiff = exports2.diffCss = exports2.sentenceDiff = exports2.diffSentences = exports2.diffTrimmedLines = exports2.lineDiff = exports2.diffLines = exports2.wordsWithSpaceDiff = exports2.diffWordsWithSpace = exports2.wordDiff = exports2.diffWords = exports2.characterDiff = exports2.diffChars = exports2.Diff = void 0;
    var base_js_1 = require_base();
    exports2.Diff = base_js_1.default;
    var character_js_1 = require_character();
    Object.defineProperty(exports2, "diffChars", { enumerable: true, get: function() {
      return character_js_1.diffChars;
    } });
    Object.defineProperty(exports2, "characterDiff", { enumerable: true, get: function() {
      return character_js_1.characterDiff;
    } });
    var word_js_1 = require_word();
    Object.defineProperty(exports2, "diffWords", { enumerable: true, get: function() {
      return word_js_1.diffWords;
    } });
    Object.defineProperty(exports2, "diffWordsWithSpace", { enumerable: true, get: function() {
      return word_js_1.diffWordsWithSpace;
    } });
    Object.defineProperty(exports2, "wordDiff", { enumerable: true, get: function() {
      return word_js_1.wordDiff;
    } });
    Object.defineProperty(exports2, "wordsWithSpaceDiff", { enumerable: true, get: function() {
      return word_js_1.wordsWithSpaceDiff;
    } });
    var line_js_1 = require_line();
    Object.defineProperty(exports2, "diffLines", { enumerable: true, get: function() {
      return line_js_1.diffLines;
    } });
    Object.defineProperty(exports2, "diffTrimmedLines", { enumerable: true, get: function() {
      return line_js_1.diffTrimmedLines;
    } });
    Object.defineProperty(exports2, "lineDiff", { enumerable: true, get: function() {
      return line_js_1.lineDiff;
    } });
    var sentence_js_1 = require_sentence();
    Object.defineProperty(exports2, "diffSentences", { enumerable: true, get: function() {
      return sentence_js_1.diffSentences;
    } });
    Object.defineProperty(exports2, "sentenceDiff", { enumerable: true, get: function() {
      return sentence_js_1.sentenceDiff;
    } });
    var css_js_1 = require_css();
    Object.defineProperty(exports2, "diffCss", { enumerable: true, get: function() {
      return css_js_1.diffCss;
    } });
    Object.defineProperty(exports2, "cssDiff", { enumerable: true, get: function() {
      return css_js_1.cssDiff;
    } });
    var json_js_1 = require_json();
    Object.defineProperty(exports2, "diffJson", { enumerable: true, get: function() {
      return json_js_1.diffJson;
    } });
    Object.defineProperty(exports2, "canonicalize", { enumerable: true, get: function() {
      return json_js_1.canonicalize;
    } });
    Object.defineProperty(exports2, "jsonDiff", { enumerable: true, get: function() {
      return json_js_1.jsonDiff;
    } });
    var array_js_1 = require_array();
    Object.defineProperty(exports2, "diffArrays", { enumerable: true, get: function() {
      return array_js_1.diffArrays;
    } });
    Object.defineProperty(exports2, "arrayDiff", { enumerable: true, get: function() {
      return array_js_1.arrayDiff;
    } });
    var apply_js_1 = require_apply();
    Object.defineProperty(exports2, "applyPatch", { enumerable: true, get: function() {
      return apply_js_1.applyPatch;
    } });
    Object.defineProperty(exports2, "applyPatches", { enumerable: true, get: function() {
      return apply_js_1.applyPatches;
    } });
    var parse_js_1 = require_parse();
    Object.defineProperty(exports2, "parsePatch", { enumerable: true, get: function() {
      return parse_js_1.parsePatch;
    } });
    var reverse_js_1 = require_reverse();
    Object.defineProperty(exports2, "reversePatch", { enumerable: true, get: function() {
      return reverse_js_1.reversePatch;
    } });
    var create_js_1 = require_create();
    Object.defineProperty(exports2, "structuredPatch", { enumerable: true, get: function() {
      return create_js_1.structuredPatch;
    } });
    Object.defineProperty(exports2, "createTwoFilesPatch", { enumerable: true, get: function() {
      return create_js_1.createTwoFilesPatch;
    } });
    Object.defineProperty(exports2, "createPatch", { enumerable: true, get: function() {
      return create_js_1.createPatch;
    } });
    Object.defineProperty(exports2, "formatPatch", { enumerable: true, get: function() {
      return create_js_1.formatPatch;
    } });
    var dmp_js_1 = require_dmp();
    Object.defineProperty(exports2, "convertChangesToDMP", { enumerable: true, get: function() {
      return dmp_js_1.convertChangesToDMP;
    } });
    var xml_js_1 = require_xml();
    Object.defineProperty(exports2, "convertChangesToXML", { enumerable: true, get: function() {
      return xml_js_1.convertChangesToXML;
    } });
  }
});

// src/main.ts
var import_child_process = require("child_process");
var import_util = __toESM(require("util"));
var dotenv = __toESM(require_main());
var execAsync = import_util.default.promisify(import_child_process.exec);
var diff = require_libcjs();
dotenv.config();
var core = {
  getInput(name) {
    const value = process.env[name.replace(/-/g, "_").toUpperCase()];
    if (!value) {
      this.setFailed(`Missing environment variable for ${name}`);
      process.exit(1);
    }
    return value;
  },
  setFailed(message) {
    console.error(`\u274C ${message}`);
  },
  info(message) {
    console.info(`\u2139\uFE0F ${message}`);
  },
  warning(message) {
    console.warn(`\u26A0\uFE0F ${message}`);
  },
  setDebug(message) {
    console.debug(`\u{1F41E} ${message}`);
  }
};
(async function main() {
  try {
    core.info("Starting the action...");
    const productId = core.getInput("product-id");
    const sellerId = core.getInput("seller-id");
    const tenantId = core.getInput("tenant-id");
    const clientId = core.getInput("client-id");
    const clientSecret = core.getInput("client-secret");
    const packagePath = core.getInput("package-path");
    const command = core.getInput("command");
    if (!productId || !sellerId || !tenantId || !clientId || !clientSecret) {
      core.setFailed("Missing required inputs");
      return;
    }
    core.info("Configuration completed successfully.");
    if (command === "getmetadata") {
      core.info("Fetching metadata...");
      const metadataCmd = (0, import_child_process.exec)(`msstore submission get ${productId}`);
      if (metadataCmd.stdout) {
        metadataCmd.stdout.on("data", (data) => process.stdout.write(data));
      }
      if (metadataCmd.stderr) {
        metadataCmd.stderr.on("data", (data) => process.stderr.write(data));
      }
      await new Promise((resolve, reject) => {
        metadataCmd.on("close", (code) => {
          if (code === 0) resolve(void 0);
          else reject(`Metadata process exited with code ${code}`);
        });
        metadataCmd.on("error", reject);
      });
      core.info("Metadata fetched successfully.");
    } else if (command === "publish") {
      const fs = await import("fs/promises");
      const jsonFilePath = core.getInput("json-file-path") || "";
      if (!jsonFilePath) {
        core.warning("Missing input: json-file-path assuming metadata need not be changed");
      } else {
        let metadata_given_json;
        let metadata_given_string;
        let metadata_present_json;
        let metadata_present_string;
        core.info("Reading JSON file for metadata");
        try {
          metadata_given_json = JSON.parse((await fs.readFile(jsonFilePath, "utf-8")).replace(
            /"(?:[^"\\]|\\.)*"/g,
            (str) => str.replace(/(\r\n|\r|\n)/g, "\\n")
          ));
          metadata_given_string = JSON.stringify(metadata_given_json, null, 2);
          core.info("JSON file read successfully. ...");
        } catch (error) {
          core.warning(`Could not read/parse JSON file at ${jsonFilePath}. Skipping comparison.`);
          core.warning(error);
          return;
        }
        core.info("Fetching current metadata for comparison...");
        try {
          metadata_present_json = JSON.parse((await execAsync(`msstore submission get ${productId}`)).stdout.replace(
            /"(?:[^"\\]|\\.)*"/g,
            (str) => str.replace(/(\r\n|\r|\n)/g, "\\n")
          ));
          metadata_present_string = JSON.stringify(metadata_present_json, null, 2);
          core.info("Current metadata fetched successfully.");
        } catch (error) {
          core.warning("Failed to parse metadata. Skipping comparison.");
          core.warning(error);
          return;
        }
        let isDifferent = metadata_present_string !== metadata_given_string;
        if (isDifferent) {
          core.info("Differences found between listing assets and provided assets:");
          const differences = diff.createPatch("assets", metadata_given_string, metadata_present_string, "given", "present");
          core.info("Metadata different from the provided JSON file. Proceeding with updating the metadata. Here are the differences:");
          const diffLines = differences.split("\n");
          diffLines.forEach((line) => {
            if (line.startsWith("+") || line.startsWith("-")) {
              core.info(line);
            }
          });
          metadata_present_json["Listings"]["en-us"]["BaseListing"]["Description"] = "my own plssss...";
          delete metadata_present_json["FileUploadUrl"];
          metadata_given_string = JSON.stringify(metadata_present_json, null, 2);
          const escapedJson = metadata_given_string.replace(/(["\\])/g, "\\$1").replace(/(\r\n|\r|\n)/g, "");
          core.info("Updating metadata with the provided JSON file...");
          try {
            try {
              await execAsync(`msstore submission delete ${productId} `);
            } catch (error) {
              core.warning("Failed to delete existing submission. Continuing with update.");
            }
            const P = (0, import_child_process.exec)(`msstore submission update -v ${productId} "${escapedJson}"`);
            if (P.stdout) {
              P.stdout.on("data", (data) => process.stdout.write(data));
            }
            if (P.stderr) {
              P.stderr.on("data", (data) => process.stderr.write(data));
            }
            await new Promise((resolve, reject) => {
              P.on("close", (code) => {
                if (code === 0) resolve(void 0);
                else reject(`Publish process exited with code ${code}`);
              });
              P.on("error", reject);
            });
          } catch (error) {
            core.setFailed(`Failed to update metadata: ${error}`);
            return;
          }
          core.info("Metadata updated successfully.");
          return;
        } else {
          core.info("Listing assets are identical to the provided JSON file. No action needed.");
        }
      }
      core.info("Publishing the package...");
      const publish = (0, import_child_process.exec)(`msstore publish ${packagePath} -id ${productId}`);
      if (publish.stdout) {
        publish.stdout.on("data", (data) => process.stdout.write(data));
      }
      if (publish.stderr) {
        publish.stderr.on("data", (data) => process.stderr.write(data));
      }
      await new Promise((resolve, reject) => {
        publish.on("close", (code) => {
          if (code === 0) resolve(void 0);
          else reject(`Publish process exited with code ${code}`);
        });
        publish.on("error", reject);
      });
      core.info("Package published successfully.");
    } else {
      core.setFailed("Invalid command. Use 'getmetadata' or 'publish'.");
      return;
    }
  } catch (error) {
    core.setFailed(error);
  }
})();
