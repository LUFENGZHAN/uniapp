import { shallowRef, ref, getCurrentInstance, openBlock, createElementBlock, normalizeStyle, toDisplayString, renderSlot, normalizeClass, createCommentVNode, resolveDynamicComponent, resolveComponent, createElementVNode, createVNode, createBlock, onMounted, withCtx, Fragment, renderList } from "vue";
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const hasOwn$1 = (val, key) => hasOwnProperty$1.call(val, key);
const isString = (val) => typeof val === "string";
const UNI_SSR = "__uniSSR";
const UNI_SSR_DATA = "data";
const UNI_SSR_GLOBAL_DATA = "globalData";
function getSSRDataType() {
  return getCurrentInstance() ? UNI_SSR_DATA : UNI_SSR_GLOBAL_DATA;
}
function assertKey(key, shallow = false) {
  if (!key) {
    throw new Error(`${shallow ? "shallowSsrRef" : "ssrRef"}: You must provide a key.`);
  }
}
const ssrClientRef = (value, key, shallow = false) => {
  const valRef = shallow ? shallowRef(value) : ref(value);
  if (typeof window === "undefined") {
    return valRef;
  }
  const __uniSSR = window[UNI_SSR];
  if (!__uniSSR) {
    return valRef;
  }
  const type = getSSRDataType();
  assertKey(key, shallow);
  if (hasOwn$1(__uniSSR[type], key)) {
    valRef.value = __uniSSR[type][key];
    if (type === UNI_SSR_DATA) {
      delete __uniSSR[type][key];
    }
  }
  return valRef;
};
const ssrRef = (value, key) => {
  return ssrClientRef(value, key);
};
const shallowSsrRef = (value, key) => {
  return ssrClientRef(value, key, true);
};
function formatAppLog(type, filename, ...args) {
  if (uni.__log__) {
    uni.__log__(type, filename, ...args);
  } else {
    console[type].apply(console, [...args, filename]);
  }
}
function resolveEasycom(component, easycom) {
  return isString(component) ? easycom : component;
}
const isObject = (val) => val !== null && typeof val === "object";
const defaultDelimiters = ["{", "}"];
class BaseFormatter {
  constructor() {
    this._caches = /* @__PURE__ */ Object.create(null);
  }
  interpolate(message, values, delimiters = defaultDelimiters) {
    if (!values) {
      return [message];
    }
    let tokens = this._caches[message];
    if (!tokens) {
      tokens = parse(message, delimiters);
      this._caches[message] = tokens;
    }
    return compile(tokens, values);
  }
}
const RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
const RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;
function parse(format, [startDelimiter, endDelimiter]) {
  const tokens = [];
  let position = 0;
  let text = "";
  while (position < format.length) {
    let char = format[position++];
    if (char === startDelimiter) {
      if (text) {
        tokens.push({ type: "text", value: text });
      }
      text = "";
      let sub = "";
      char = format[position++];
      while (char !== void 0 && char !== endDelimiter) {
        sub += char;
        char = format[position++];
      }
      const isClosed = char === endDelimiter;
      const type = RE_TOKEN_LIST_VALUE.test(sub) ? "list" : isClosed && RE_TOKEN_NAMED_VALUE.test(sub) ? "named" : "unknown";
      tokens.push({ value: sub, type });
    } else {
      text += char;
    }
  }
  text && tokens.push({ type: "text", value: text });
  return tokens;
}
function compile(tokens, values) {
  const compiled = [];
  let index = 0;
  const mode = Array.isArray(values) ? "list" : isObject(values) ? "named" : "unknown";
  if (mode === "unknown") {
    return compiled;
  }
  while (index < tokens.length) {
    const token = tokens[index];
    switch (token.type) {
      case "text":
        compiled.push(token.value);
        break;
      case "list":
        compiled.push(values[parseInt(token.value, 10)]);
        break;
      case "named":
        if (mode === "named") {
          compiled.push(values[token.value]);
        } else {
          {
            console.warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
          }
        }
        break;
      case "unknown":
        {
          console.warn(`Detect 'unknown' type of token!`);
        }
        break;
    }
    index++;
  }
  return compiled;
}
const LOCALE_ZH_HANS = "zh-Hans";
const LOCALE_ZH_HANT = "zh-Hant";
const LOCALE_EN = "en";
const LOCALE_FR = "fr";
const LOCALE_ES = "es";
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const defaultFormatter = new BaseFormatter();
function include(str, parts) {
  return !!parts.find((part) => str.indexOf(part) !== -1);
}
function startsWith(str, parts) {
  return parts.find((part) => str.indexOf(part) === 0);
}
function normalizeLocale(locale, messages2) {
  if (!locale) {
    return;
  }
  locale = locale.trim().replace(/_/g, "-");
  if (messages2 && messages2[locale]) {
    return locale;
  }
  locale = locale.toLowerCase();
  if (locale === "chinese") {
    return LOCALE_ZH_HANS;
  }
  if (locale.indexOf("zh") === 0) {
    if (locale.indexOf("-hans") > -1) {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf("-hant") > -1) {
      return LOCALE_ZH_HANT;
    }
    if (include(locale, ["-tw", "-hk", "-mo", "-cht"])) {
      return LOCALE_ZH_HANT;
    }
    return LOCALE_ZH_HANS;
  }
  let locales = [LOCALE_EN, LOCALE_FR, LOCALE_ES];
  if (messages2 && Object.keys(messages2).length > 0) {
    locales = Object.keys(messages2);
  }
  const lang = startsWith(locale, locales);
  if (lang) {
    return lang;
  }
}
class I18n {
  constructor({ locale, fallbackLocale, messages: messages2, watcher, formater }) {
    this.locale = LOCALE_EN;
    this.fallbackLocale = LOCALE_EN;
    this.message = {};
    this.messages = {};
    this.watchers = [];
    if (fallbackLocale) {
      this.fallbackLocale = fallbackLocale;
    }
    this.formater = formater || defaultFormatter;
    this.messages = messages2 || {};
    this.setLocale(locale || LOCALE_EN);
    if (watcher) {
      this.watchLocale(watcher);
    }
  }
  setLocale(locale) {
    const oldLocale = this.locale;
    this.locale = normalizeLocale(locale, this.messages) || this.fallbackLocale;
    if (!this.messages[this.locale]) {
      this.messages[this.locale] = {};
    }
    this.message = this.messages[this.locale];
    if (oldLocale !== this.locale) {
      this.watchers.forEach((watcher) => {
        watcher(this.locale, oldLocale);
      });
    }
  }
  getLocale() {
    return this.locale;
  }
  watchLocale(fn) {
    const index = this.watchers.push(fn) - 1;
    return () => {
      this.watchers.splice(index, 1);
    };
  }
  add(locale, message, override = true) {
    const curMessages = this.messages[locale];
    if (curMessages) {
      if (override) {
        Object.assign(curMessages, message);
      } else {
        Object.keys(message).forEach((key) => {
          if (!hasOwn(curMessages, key)) {
            curMessages[key] = message[key];
          }
        });
      }
    } else {
      this.messages[locale] = message;
    }
  }
  f(message, values, delimiters) {
    return this.formater.interpolate(message, values, delimiters).join("");
  }
  t(key, locale, values) {
    let message = this.message;
    if (typeof locale === "string") {
      locale = normalizeLocale(locale, this.messages);
      locale && (message = this.messages[locale]);
    } else {
      values = locale;
    }
    if (!hasOwn(message, key)) {
      console.warn(`Cannot translate the value of keypath ${key}. Use the value of keypath as default.`);
      return key;
    }
    return this.formater.interpolate(message[key], values).join("");
  }
}
function watchAppLocale(appVm, i18n) {
  if (appVm.$watchLocale) {
    appVm.$watchLocale((newLocale) => {
      i18n.setLocale(newLocale);
    });
  } else {
    appVm.$watch(() => appVm.$locale, (newLocale) => {
      i18n.setLocale(newLocale);
    });
  }
}
function getDefaultLocale() {
  if (typeof uni !== "undefined" && uni.getLocale) {
    return uni.getLocale();
  }
  if (typeof global !== "undefined" && global.getLocale) {
    return global.getLocale();
  }
  return LOCALE_EN;
}
function initVueI18n(locale, messages2 = {}, fallbackLocale, watcher) {
  if (typeof locale !== "string") {
    [locale, messages2] = [
      messages2,
      locale
    ];
  }
  if (typeof locale !== "string") {
    locale = getDefaultLocale();
  }
  if (typeof fallbackLocale !== "string") {
    fallbackLocale = typeof __uniConfig !== "undefined" && __uniConfig.fallbackLocale || LOCALE_EN;
  }
  const i18n = new I18n({
    locale,
    fallbackLocale,
    messages: messages2,
    watcher
  });
  let t2 = (key, values) => {
    if (typeof getApp !== "function") {
      t2 = function(key2, values2) {
        return i18n.t(key2, values2);
      };
    } else {
      let isWatchedAppLocale = false;
      t2 = function(key2, values2) {
        const appVm = getApp().$vm;
        if (appVm) {
          appVm.$locale;
          if (!isWatchedAppLocale) {
            isWatchedAppLocale = true;
            watchAppLocale(appVm, i18n);
          }
        }
        return i18n.t(key2, values2);
      };
    }
    return t2(key, values);
  };
  return {
    i18n,
    f(message, values, delimiters) {
      return i18n.f(message, values, delimiters);
    },
    t(key, values) {
      return t2(key, values);
    },
    add(locale2, message, override = true) {
      return i18n.add(locale2, message, override);
    },
    watch(fn) {
      return i18n.watchLocale(fn);
    },
    getLocale() {
      return i18n.getLocale();
    },
    setLocale(newLocale) {
      return i18n.setLocale(newLocale);
    }
  };
}
const pages = [
  {
    path: "pages/login/login",
    style: {
      navigationBarTitleText: "登录",
      enablePullDownRefresh: false
    }
  },
  {
    path: "pages/home/home",
    style: {
      navigationBarTitleText: "首页",
      enablePullDownRefresh: false
    }
  },
  {
    path: "pages/list/list",
    style: {
      navigationBarTitleText: "",
      enablePullDownRefresh: false,
      "app-plus": {
        scrollIndicator: "none",
        titleNView: {
          searchInput: {
            align: "left",
            borderRadius: "25px"
          }
        }
      }
    }
  },
  {
    path: "pages/game_common/plone",
    style: {
      navigationBarTitleText: "小灰机",
      enablePullDownRefresh: false,
      transparentTitle: "always"
    }
  }
];
const globalStyle = {
  navigationBarTextStyle: "black",
  navigationBarTitleText: "首页",
  navigationBarBackgroundColor: "#f4f4f4",
  backgroundColor: "#f0f0f0",
  "app-plus": {
    scrollIndicator: "none"
  }
};
const uniIdRouter = {
  loginPage: "pages/login/login"
};
const tabBar = {
  backgroundColor: "#ffffff",
  list: [
    {
      iconPath: "static/home-hide.png",
      selectedIconPath: "static/home.png",
      pagePath: "pages/home/home",
      text: "首页"
    },
    {
      iconPath: "static/list-hide.png",
      selectedIconPath: "static/list.png",
      pagePath: "pages/list/list",
      text: "列表"
    },
    {
      iconPath: "static/login-hide.png",
      selectedIconPath: "static/login.png",
      pagePath: "pages/login/login",
      text: "个人中心"
    }
  ]
};
const t$1 = {
  pages,
  globalStyle,
  uniIdRouter,
  tabBar
};
function n(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function s(e, t2, n2) {
  return e(n2 = { path: t2, exports: {}, require: function(e2, t3) {
    return function() {
      throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
    }(null == t3 && n2.path);
  } }, n2.exports), n2.exports;
}
var r = s(function(e, t2) {
  var n2;
  e.exports = (n2 = n2 || function(e2, t3) {
    var n3 = Object.create || function() {
      function e3() {
      }
      return function(t4) {
        var n4;
        return e3.prototype = t4, n4 = new e3(), e3.prototype = null, n4;
      };
    }(), s2 = {}, r2 = s2.lib = {}, i2 = r2.Base = { extend: function(e3) {
      var t4 = n3(this);
      return e3 && t4.mixIn(e3), t4.hasOwnProperty("init") && this.init !== t4.init || (t4.init = function() {
        t4.$super.init.apply(this, arguments);
      }), t4.init.prototype = t4, t4.$super = this, t4;
    }, create: function() {
      var e3 = this.extend();
      return e3.init.apply(e3, arguments), e3;
    }, init: function() {
    }, mixIn: function(e3) {
      for (var t4 in e3)
        e3.hasOwnProperty(t4) && (this[t4] = e3[t4]);
      e3.hasOwnProperty("toString") && (this.toString = e3.toString);
    }, clone: function() {
      return this.init.prototype.extend(this);
    } }, o2 = r2.WordArray = i2.extend({ init: function(e3, n4) {
      e3 = this.words = e3 || [], this.sigBytes = n4 != t3 ? n4 : 4 * e3.length;
    }, toString: function(e3) {
      return (e3 || c2).stringify(this);
    }, concat: function(e3) {
      var t4 = this.words, n4 = e3.words, s3 = this.sigBytes, r3 = e3.sigBytes;
      if (this.clamp(), s3 % 4)
        for (var i3 = 0; i3 < r3; i3++) {
          var o3 = n4[i3 >>> 2] >>> 24 - i3 % 4 * 8 & 255;
          t4[s3 + i3 >>> 2] |= o3 << 24 - (s3 + i3) % 4 * 8;
        }
      else
        for (i3 = 0; i3 < r3; i3 += 4)
          t4[s3 + i3 >>> 2] = n4[i3 >>> 2];
      return this.sigBytes += r3, this;
    }, clamp: function() {
      var t4 = this.words, n4 = this.sigBytes;
      t4[n4 >>> 2] &= 4294967295 << 32 - n4 % 4 * 8, t4.length = e2.ceil(n4 / 4);
    }, clone: function() {
      var e3 = i2.clone.call(this);
      return e3.words = this.words.slice(0), e3;
    }, random: function(t4) {
      for (var n4, s3 = [], r3 = function(t5) {
        t5 = t5;
        var n5 = 987654321, s4 = 4294967295;
        return function() {
          var r4 = ((n5 = 36969 * (65535 & n5) + (n5 >> 16) & s4) << 16) + (t5 = 18e3 * (65535 & t5) + (t5 >> 16) & s4) & s4;
          return r4 /= 4294967296, (r4 += 0.5) * (e2.random() > 0.5 ? 1 : -1);
        };
      }, i3 = 0; i3 < t4; i3 += 4) {
        var a3 = r3(4294967296 * (n4 || e2.random()));
        n4 = 987654071 * a3(), s3.push(4294967296 * a3() | 0);
      }
      return new o2.init(s3, t4);
    } }), a2 = s2.enc = {}, c2 = a2.Hex = { stringify: function(e3) {
      for (var t4 = e3.words, n4 = e3.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
        var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
        s3.push((i3 >>> 4).toString(16)), s3.push((15 & i3).toString(16));
      }
      return s3.join("");
    }, parse: function(e3) {
      for (var t4 = e3.length, n4 = [], s3 = 0; s3 < t4; s3 += 2)
        n4[s3 >>> 3] |= parseInt(e3.substr(s3, 2), 16) << 24 - s3 % 8 * 4;
      return new o2.init(n4, t4 / 2);
    } }, u2 = a2.Latin1 = { stringify: function(e3) {
      for (var t4 = e3.words, n4 = e3.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
        var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
        s3.push(String.fromCharCode(i3));
      }
      return s3.join("");
    }, parse: function(e3) {
      for (var t4 = e3.length, n4 = [], s3 = 0; s3 < t4; s3++)
        n4[s3 >>> 2] |= (255 & e3.charCodeAt(s3)) << 24 - s3 % 4 * 8;
      return new o2.init(n4, t4);
    } }, h2 = a2.Utf8 = { stringify: function(e3) {
      try {
        return decodeURIComponent(escape(u2.stringify(e3)));
      } catch (e4) {
        throw new Error("Malformed UTF-8 data");
      }
    }, parse: function(e3) {
      return u2.parse(unescape(encodeURIComponent(e3)));
    } }, l2 = r2.BufferedBlockAlgorithm = i2.extend({ reset: function() {
      this._data = new o2.init(), this._nDataBytes = 0;
    }, _append: function(e3) {
      "string" == typeof e3 && (e3 = h2.parse(e3)), this._data.concat(e3), this._nDataBytes += e3.sigBytes;
    }, _process: function(t4) {
      var n4 = this._data, s3 = n4.words, r3 = n4.sigBytes, i3 = this.blockSize, a3 = r3 / (4 * i3), c3 = (a3 = t4 ? e2.ceil(a3) : e2.max((0 | a3) - this._minBufferSize, 0)) * i3, u3 = e2.min(4 * c3, r3);
      if (c3) {
        for (var h3 = 0; h3 < c3; h3 += i3)
          this._doProcessBlock(s3, h3);
        var l3 = s3.splice(0, c3);
        n4.sigBytes -= u3;
      }
      return new o2.init(l3, u3);
    }, clone: function() {
      var e3 = i2.clone.call(this);
      return e3._data = this._data.clone(), e3;
    }, _minBufferSize: 0 });
    r2.Hasher = l2.extend({ cfg: i2.extend(), init: function(e3) {
      this.cfg = this.cfg.extend(e3), this.reset();
    }, reset: function() {
      l2.reset.call(this), this._doReset();
    }, update: function(e3) {
      return this._append(e3), this._process(), this;
    }, finalize: function(e3) {
      return e3 && this._append(e3), this._doFinalize();
    }, blockSize: 16, _createHelper: function(e3) {
      return function(t4, n4) {
        return new e3.init(n4).finalize(t4);
      };
    }, _createHmacHelper: function(e3) {
      return function(t4, n4) {
        return new d2.HMAC.init(e3, n4).finalize(t4);
      };
    } });
    var d2 = s2.algo = {};
    return s2;
  }(Math), n2);
}), i = r, o = (s(function(e, t2) {
  var n2;
  e.exports = (n2 = i, function(e2) {
    var t3 = n2, s2 = t3.lib, r2 = s2.WordArray, i2 = s2.Hasher, o2 = t3.algo, a2 = [];
    !function() {
      for (var t4 = 0; t4 < 64; t4++)
        a2[t4] = 4294967296 * e2.abs(e2.sin(t4 + 1)) | 0;
    }();
    var c2 = o2.MD5 = i2.extend({ _doReset: function() {
      this._hash = new r2.init([1732584193, 4023233417, 2562383102, 271733878]);
    }, _doProcessBlock: function(e3, t4) {
      for (var n3 = 0; n3 < 16; n3++) {
        var s3 = t4 + n3, r3 = e3[s3];
        e3[s3] = 16711935 & (r3 << 8 | r3 >>> 24) | 4278255360 & (r3 << 24 | r3 >>> 8);
      }
      var i3 = this._hash.words, o3 = e3[t4 + 0], c3 = e3[t4 + 1], p2 = e3[t4 + 2], f2 = e3[t4 + 3], g2 = e3[t4 + 4], m2 = e3[t4 + 5], y2 = e3[t4 + 6], _2 = e3[t4 + 7], w2 = e3[t4 + 8], v2 = e3[t4 + 9], I2 = e3[t4 + 10], S2 = e3[t4 + 11], b2 = e3[t4 + 12], k2 = e3[t4 + 13], C = e3[t4 + 14], T2 = e3[t4 + 15], P2 = i3[0], A2 = i3[1], E2 = i3[2], O = i3[3];
      P2 = u2(P2, A2, E2, O, o3, 7, a2[0]), O = u2(O, P2, A2, E2, c3, 12, a2[1]), E2 = u2(E2, O, P2, A2, p2, 17, a2[2]), A2 = u2(A2, E2, O, P2, f2, 22, a2[3]), P2 = u2(P2, A2, E2, O, g2, 7, a2[4]), O = u2(O, P2, A2, E2, m2, 12, a2[5]), E2 = u2(E2, O, P2, A2, y2, 17, a2[6]), A2 = u2(A2, E2, O, P2, _2, 22, a2[7]), P2 = u2(P2, A2, E2, O, w2, 7, a2[8]), O = u2(O, P2, A2, E2, v2, 12, a2[9]), E2 = u2(E2, O, P2, A2, I2, 17, a2[10]), A2 = u2(A2, E2, O, P2, S2, 22, a2[11]), P2 = u2(P2, A2, E2, O, b2, 7, a2[12]), O = u2(O, P2, A2, E2, k2, 12, a2[13]), E2 = u2(E2, O, P2, A2, C, 17, a2[14]), P2 = h2(P2, A2 = u2(A2, E2, O, P2, T2, 22, a2[15]), E2, O, c3, 5, a2[16]), O = h2(O, P2, A2, E2, y2, 9, a2[17]), E2 = h2(E2, O, P2, A2, S2, 14, a2[18]), A2 = h2(A2, E2, O, P2, o3, 20, a2[19]), P2 = h2(P2, A2, E2, O, m2, 5, a2[20]), O = h2(O, P2, A2, E2, I2, 9, a2[21]), E2 = h2(E2, O, P2, A2, T2, 14, a2[22]), A2 = h2(A2, E2, O, P2, g2, 20, a2[23]), P2 = h2(P2, A2, E2, O, v2, 5, a2[24]), O = h2(O, P2, A2, E2, C, 9, a2[25]), E2 = h2(E2, O, P2, A2, f2, 14, a2[26]), A2 = h2(A2, E2, O, P2, w2, 20, a2[27]), P2 = h2(P2, A2, E2, O, k2, 5, a2[28]), O = h2(O, P2, A2, E2, p2, 9, a2[29]), E2 = h2(E2, O, P2, A2, _2, 14, a2[30]), P2 = l2(P2, A2 = h2(A2, E2, O, P2, b2, 20, a2[31]), E2, O, m2, 4, a2[32]), O = l2(O, P2, A2, E2, w2, 11, a2[33]), E2 = l2(E2, O, P2, A2, S2, 16, a2[34]), A2 = l2(A2, E2, O, P2, C, 23, a2[35]), P2 = l2(P2, A2, E2, O, c3, 4, a2[36]), O = l2(O, P2, A2, E2, g2, 11, a2[37]), E2 = l2(E2, O, P2, A2, _2, 16, a2[38]), A2 = l2(A2, E2, O, P2, I2, 23, a2[39]), P2 = l2(P2, A2, E2, O, k2, 4, a2[40]), O = l2(O, P2, A2, E2, o3, 11, a2[41]), E2 = l2(E2, O, P2, A2, f2, 16, a2[42]), A2 = l2(A2, E2, O, P2, y2, 23, a2[43]), P2 = l2(P2, A2, E2, O, v2, 4, a2[44]), O = l2(O, P2, A2, E2, b2, 11, a2[45]), E2 = l2(E2, O, P2, A2, T2, 16, a2[46]), P2 = d2(P2, A2 = l2(A2, E2, O, P2, p2, 23, a2[47]), E2, O, o3, 6, a2[48]), O = d2(O, P2, A2, E2, _2, 10, a2[49]), E2 = d2(E2, O, P2, A2, C, 15, a2[50]), A2 = d2(A2, E2, O, P2, m2, 21, a2[51]), P2 = d2(P2, A2, E2, O, b2, 6, a2[52]), O = d2(O, P2, A2, E2, f2, 10, a2[53]), E2 = d2(E2, O, P2, A2, I2, 15, a2[54]), A2 = d2(A2, E2, O, P2, c3, 21, a2[55]), P2 = d2(P2, A2, E2, O, w2, 6, a2[56]), O = d2(O, P2, A2, E2, T2, 10, a2[57]), E2 = d2(E2, O, P2, A2, y2, 15, a2[58]), A2 = d2(A2, E2, O, P2, k2, 21, a2[59]), P2 = d2(P2, A2, E2, O, g2, 6, a2[60]), O = d2(O, P2, A2, E2, S2, 10, a2[61]), E2 = d2(E2, O, P2, A2, p2, 15, a2[62]), A2 = d2(A2, E2, O, P2, v2, 21, a2[63]), i3[0] = i3[0] + P2 | 0, i3[1] = i3[1] + A2 | 0, i3[2] = i3[2] + E2 | 0, i3[3] = i3[3] + O | 0;
    }, _doFinalize: function() {
      var t4 = this._data, n3 = t4.words, s3 = 8 * this._nDataBytes, r3 = 8 * t4.sigBytes;
      n3[r3 >>> 5] |= 128 << 24 - r3 % 32;
      var i3 = e2.floor(s3 / 4294967296), o3 = s3;
      n3[15 + (r3 + 64 >>> 9 << 4)] = 16711935 & (i3 << 8 | i3 >>> 24) | 4278255360 & (i3 << 24 | i3 >>> 8), n3[14 + (r3 + 64 >>> 9 << 4)] = 16711935 & (o3 << 8 | o3 >>> 24) | 4278255360 & (o3 << 24 | o3 >>> 8), t4.sigBytes = 4 * (n3.length + 1), this._process();
      for (var a3 = this._hash, c3 = a3.words, u3 = 0; u3 < 4; u3++) {
        var h3 = c3[u3];
        c3[u3] = 16711935 & (h3 << 8 | h3 >>> 24) | 4278255360 & (h3 << 24 | h3 >>> 8);
      }
      return a3;
    }, clone: function() {
      var e3 = i2.clone.call(this);
      return e3._hash = this._hash.clone(), e3;
    } });
    function u2(e3, t4, n3, s3, r3, i3, o3) {
      var a3 = e3 + (t4 & n3 | ~t4 & s3) + r3 + o3;
      return (a3 << i3 | a3 >>> 32 - i3) + t4;
    }
    function h2(e3, t4, n3, s3, r3, i3, o3) {
      var a3 = e3 + (t4 & s3 | n3 & ~s3) + r3 + o3;
      return (a3 << i3 | a3 >>> 32 - i3) + t4;
    }
    function l2(e3, t4, n3, s3, r3, i3, o3) {
      var a3 = e3 + (t4 ^ n3 ^ s3) + r3 + o3;
      return (a3 << i3 | a3 >>> 32 - i3) + t4;
    }
    function d2(e3, t4, n3, s3, r3, i3, o3) {
      var a3 = e3 + (n3 ^ (t4 | ~s3)) + r3 + o3;
      return (a3 << i3 | a3 >>> 32 - i3) + t4;
    }
    t3.MD5 = i2._createHelper(c2), t3.HmacMD5 = i2._createHmacHelper(c2);
  }(Math), n2.MD5);
}), s(function(e, t2) {
  var n2;
  e.exports = (n2 = i, void function() {
    var e2 = n2, t3 = e2.lib.Base, s2 = e2.enc.Utf8;
    e2.algo.HMAC = t3.extend({ init: function(e3, t4) {
      e3 = this._hasher = new e3.init(), "string" == typeof t4 && (t4 = s2.parse(t4));
      var n3 = e3.blockSize, r2 = 4 * n3;
      t4.sigBytes > r2 && (t4 = e3.finalize(t4)), t4.clamp();
      for (var i2 = this._oKey = t4.clone(), o2 = this._iKey = t4.clone(), a2 = i2.words, c2 = o2.words, u2 = 0; u2 < n3; u2++)
        a2[u2] ^= 1549556828, c2[u2] ^= 909522486;
      i2.sigBytes = o2.sigBytes = r2, this.reset();
    }, reset: function() {
      var e3 = this._hasher;
      e3.reset(), e3.update(this._iKey);
    }, update: function(e3) {
      return this._hasher.update(e3), this;
    }, finalize: function(e3) {
      var t4 = this._hasher, n3 = t4.finalize(e3);
      return t4.reset(), t4.finalize(this._oKey.clone().concat(n3));
    } });
  }());
}), s(function(e, t2) {
  e.exports = i.HmacMD5;
})), a = s(function(e, t2) {
  e.exports = i.enc.Utf8;
}), c = s(function(e, t2) {
  var n2;
  e.exports = (n2 = i, function() {
    var e2 = n2, t3 = e2.lib.WordArray;
    function s2(e3, n3, s3) {
      for (var r2 = [], i2 = 0, o2 = 0; o2 < n3; o2++)
        if (o2 % 4) {
          var a2 = s3[e3.charCodeAt(o2 - 1)] << o2 % 4 * 2, c2 = s3[e3.charCodeAt(o2)] >>> 6 - o2 % 4 * 2;
          r2[i2 >>> 2] |= (a2 | c2) << 24 - i2 % 4 * 8, i2++;
        }
      return t3.create(r2, i2);
    }
    e2.enc.Base64 = { stringify: function(e3) {
      var t4 = e3.words, n3 = e3.sigBytes, s3 = this._map;
      e3.clamp();
      for (var r2 = [], i2 = 0; i2 < n3; i2 += 3)
        for (var o2 = (t4[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255) << 16 | (t4[i2 + 1 >>> 2] >>> 24 - (i2 + 1) % 4 * 8 & 255) << 8 | t4[i2 + 2 >>> 2] >>> 24 - (i2 + 2) % 4 * 8 & 255, a2 = 0; a2 < 4 && i2 + 0.75 * a2 < n3; a2++)
          r2.push(s3.charAt(o2 >>> 6 * (3 - a2) & 63));
      var c2 = s3.charAt(64);
      if (c2)
        for (; r2.length % 4; )
          r2.push(c2);
      return r2.join("");
    }, parse: function(e3) {
      var t4 = e3.length, n3 = this._map, r2 = this._reverseMap;
      if (!r2) {
        r2 = this._reverseMap = [];
        for (var i2 = 0; i2 < n3.length; i2++)
          r2[n3.charCodeAt(i2)] = i2;
      }
      var o2 = n3.charAt(64);
      if (o2) {
        var a2 = e3.indexOf(o2);
        -1 !== a2 && (t4 = a2);
      }
      return s2(e3, t4, r2);
    }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" };
  }(), n2.enc.Base64);
});
const u = "FUNCTION", h = "OBJECT", l = "CLIENT_DB", d = "pending", p = "fullfilled", f = "rejected";
function g(e) {
  return Object.prototype.toString.call(e).slice(8, -1).toLowerCase();
}
function m(e) {
  return "object" === g(e);
}
function y(e) {
  return "function" == typeof e;
}
function _(e) {
  return function() {
    try {
      return e.apply(e, arguments);
    } catch (e2) {
      console.error(e2);
    }
  };
}
const w = "REJECTED", v = "NOT_PENDING";
class I {
  constructor({ createPromise: e, retryRule: t2 = w } = {}) {
    this.createPromise = e, this.status = null, this.promise = null, this.retryRule = t2;
  }
  get needRetry() {
    if (!this.status)
      return true;
    switch (this.retryRule) {
      case w:
        return this.status === f;
      case v:
        return this.status !== d;
    }
  }
  exec() {
    return this.needRetry ? (this.status = d, this.promise = this.createPromise().then((e) => (this.status = p, Promise.resolve(e)), (e) => (this.status = f, Promise.reject(e))), this.promise) : this.promise;
  }
}
function S(e) {
  return e && "string" == typeof e ? JSON.parse(e) : e;
}
const b = true, k = "app", T = S([]), P = k, A = S('{\n    "address": [\n        "127.0.0.1",\n        "192.168.31.120"\n    ],\n    "debugPort": 9001,\n    "initialLaunchType": "remote",\n    "servePort": 7001,\n    "skipFiles": [\n        "<node_internals>/**",\n        "D:/应用/HBuilderX/plugins/unicloud/**/*.js"\n    ]\n}\n'), E = S('[{"provider":"aliyun","spaceName":"yx-plane","spaceId":"mp-2a0e68a1-4e42-4285-b25e-1462368efa7f","clientSecret":"Qi8TgmxnDRXiSeLDWh1xTQ==","endpoint":"https://api.next.bspapp.com"}]') || [];
let x = "";
try {
  x = "__UNI__81D3AC3";
} catch (e) {
}
let R = {};
function U(e, t2 = {}) {
  var n2, s2;
  return n2 = R, s2 = e, Object.prototype.hasOwnProperty.call(n2, s2) || (R[e] = t2), R[e];
}
R = uni._globalUniCloudObj ? uni._globalUniCloudObj : uni._globalUniCloudObj = {};
const L = ["invoke", "success", "fail", "complete"], N = U("_globalUniCloudInterceptor");
function D(e, t2) {
  N[e] || (N[e] = {}), m(t2) && Object.keys(t2).forEach((n2) => {
    L.indexOf(n2) > -1 && function(e2, t3, n3) {
      let s2 = N[e2][t3];
      s2 || (s2 = N[e2][t3] = []), -1 === s2.indexOf(n3) && y(n3) && s2.push(n3);
    }(e, n2, t2[n2]);
  });
}
function F(e, t2) {
  N[e] || (N[e] = {}), m(t2) ? Object.keys(t2).forEach((n2) => {
    L.indexOf(n2) > -1 && function(e2, t3, n3) {
      const s2 = N[e2][t3];
      if (!s2)
        return;
      const r2 = s2.indexOf(n3);
      r2 > -1 && s2.splice(r2, 1);
    }(e, n2, t2[n2]);
  }) : delete N[e];
}
function M(e, t2) {
  return e && 0 !== e.length ? e.reduce((e2, n2) => e2.then(() => n2(t2)), Promise.resolve()) : Promise.resolve();
}
function q(e, t2) {
  return N[e] && N[e][t2] || [];
}
function K(e) {
  D("callObject", e);
}
const j = U("_globalUniCloudListener"), B = "response", $ = "needLogin", W = "refreshToken", z = "clientdb", J = "cloudfunction", H = "cloudobject";
function G(e) {
  return j[e] || (j[e] = []), j[e];
}
function V(e, t2) {
  const n2 = G(e);
  n2.includes(t2) || n2.push(t2);
}
function Y(e, t2) {
  const n2 = G(e), s2 = n2.indexOf(t2);
  -1 !== s2 && n2.splice(s2, 1);
}
function Q(e, t2) {
  const n2 = G(e);
  for (let e2 = 0; e2 < n2.length; e2++) {
    (0, n2[e2])(t2);
  }
}
let X, Z = false;
function ee() {
  return X || (X = new Promise((e) => {
    Z && e(), function t2() {
      if ("function" == typeof getCurrentPages) {
        const t3 = getCurrentPages();
        t3 && t3[0] && (Z = true, e());
      }
      Z || setTimeout(() => {
        t2();
      }, 30);
    }();
  }), X);
}
function te(e) {
  const t2 = {};
  for (const n2 in e) {
    const s2 = e[n2];
    y(s2) && (t2[n2] = _(s2));
  }
  return t2;
}
class ne extends Error {
  constructor(e) {
    super(e.message), this.errMsg = e.message || e.errMsg || "unknown system error", this.code = this.errCode = e.code || e.errCode || "SYSTEM_ERROR", this.errSubject = this.subject = e.subject || e.errSubject, this.cause = e.cause, this.requestId = e.requestId;
  }
  toJson(e = 0) {
    if (!(e >= 10))
      return e++, { errCode: this.errCode, errMsg: this.errMsg, errSubject: this.errSubject, cause: this.cause && this.cause.toJson ? this.cause.toJson(e) : this.cause };
  }
}
var se = { request: (e) => uni.request(e), uploadFile: (e) => uni.uploadFile(e), setStorageSync: (e, t2) => uni.setStorageSync(e, t2), getStorageSync: (e) => uni.getStorageSync(e), removeStorageSync: (e) => uni.removeStorageSync(e), clearStorageSync: () => uni.clearStorageSync() };
function re(e) {
  return e && re(e.__v_raw) || e;
}
function ie() {
  return { token: se.getStorageSync("uni_id_token") || se.getStorageSync("uniIdToken"), tokenExpired: se.getStorageSync("uni_id_token_expired") };
}
function oe({ token: e, tokenExpired: t2 } = {}) {
  e && se.setStorageSync("uni_id_token", e), t2 && se.setStorageSync("uni_id_token_expired", t2);
}
let ae, ce;
function ue() {
  return ae || (ae = uni.getSystemInfoSync()), ae;
}
function he() {
  let e, t2;
  try {
    if (uni.getLaunchOptionsSync) {
      if (uni.getLaunchOptionsSync.toString().indexOf("not yet implemented") > -1)
        return;
      const { scene: n2, channel: s2 } = uni.getLaunchOptionsSync();
      e = s2, t2 = n2;
    }
  } catch (e2) {
  }
  return { channel: e, scene: t2 };
}
function le() {
  const e = uni.getLocale && uni.getLocale() || "en";
  if (ce)
    return { ...ce, locale: e, LOCALE: e };
  const t2 = ue(), { deviceId: n2, osName: s2, uniPlatform: r2, appId: i2 } = t2, o2 = ["pixelRatio", "brand", "model", "system", "language", "version", "platform", "host", "SDKVersion", "swanNativeVersion", "app", "AppPlatform", "fontSizeSetting"];
  for (let e2 = 0; e2 < o2.length; e2++) {
    delete t2[o2[e2]];
  }
  return ce = { PLATFORM: r2, OS: s2, APPID: i2, DEVICEID: n2, ...he(), ...t2 }, { ...ce, locale: e, LOCALE: e };
}
var de = { sign: function(e, t2) {
  let n2 = "";
  return Object.keys(e).sort().forEach(function(t3) {
    e[t3] && (n2 = n2 + "&" + t3 + "=" + e[t3]);
  }), n2 = n2.slice(1), o(n2, t2).toString();
}, wrappedRequest: function(e, t2) {
  return new Promise((n2, s2) => {
    t2(Object.assign(e, { complete(e2) {
      e2 || (e2 = {});
      const t3 = e2.data && e2.data.header && e2.data.header["x-serverless-request-id"] || e2.header && e2.header["request-id"];
      if (!e2.statusCode || e2.statusCode >= 400)
        return s2(new ne({ code: "SYS_ERR", message: e2.errMsg || "request:fail", requestId: t3 }));
      const r2 = e2.data;
      if (r2.error)
        return s2(new ne({ code: r2.error.code, message: r2.error.message, requestId: t3 }));
      r2.result = r2.data, r2.requestId = t3, delete r2.data, n2(r2);
    } }));
  });
}, toBase64: function(e) {
  return c.stringify(a.parse(e));
} }, pe = { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" };
const { t: fe } = initVueI18n({ "zh-Hans": { "uniCloud.init.paramRequired": "缺少参数：{param}", "uniCloud.uploadFile.fileError": "filePath应为File对象" }, "zh-Hant": { "uniCloud.init.paramRequired": "缺少参数：{param}", "uniCloud.uploadFile.fileError": "filePath应为File对象" }, en: pe, fr: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, es: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, ja: pe }, "zh-Hans");
var ge = class {
  constructor(e) {
    ["spaceId", "clientSecret"].forEach((t2) => {
      if (!Object.prototype.hasOwnProperty.call(e, t2))
        throw new Error(fe("uniCloud.init.paramRequired", { param: t2 }));
    }), this.config = Object.assign({}, { endpoint: 0 === e.spaceId.indexOf("mp-") ? "https://api.next.bspapp.com" : "https://api.bspapp.com" }, e), this.config.provider = "aliyun", this.config.requestUrl = this.config.endpoint + "/client", this.config.envType = this.config.envType || "public", this.config.accessTokenKey = "access_token_" + this.config.spaceId, this.adapter = se, this._getAccessTokenPromiseHub = new I({ createPromise: () => this.requestAuth(this.setupRequest({ method: "serverless.auth.user.anonymousAuthorize", params: "{}" }, "auth")).then((e2) => {
      if (!e2.result || !e2.result.accessToken)
        throw new ne({ code: "AUTH_FAILED", message: "获取accessToken失败" });
      this.setAccessToken(e2.result.accessToken);
    }), retryRule: v });
  }
  get hasAccessToken() {
    return !!this.accessToken;
  }
  setAccessToken(e) {
    this.accessToken = e;
  }
  requestWrapped(e) {
    return de.wrappedRequest(e, this.adapter.request);
  }
  requestAuth(e) {
    return this.requestWrapped(e);
  }
  request(e, t2) {
    return Promise.resolve().then(() => this.hasAccessToken ? t2 ? this.requestWrapped(e) : this.requestWrapped(e).catch((t3) => new Promise((e2, n2) => {
      !t3 || "GATEWAY_INVALID_TOKEN" !== t3.code && "InvalidParameter.InvalidToken" !== t3.code ? n2(t3) : e2();
    }).then(() => this.getAccessToken()).then(() => {
      const t4 = this.rebuildRequest(e);
      return this.request(t4, true);
    })) : this.getAccessToken().then(() => {
      const t3 = this.rebuildRequest(e);
      return this.request(t3, true);
    }));
  }
  rebuildRequest(e) {
    const t2 = Object.assign({}, e);
    return t2.data.token = this.accessToken, t2.header["x-basement-token"] = this.accessToken, t2.header["x-serverless-sign"] = de.sign(t2.data, this.config.clientSecret), t2;
  }
  setupRequest(e, t2) {
    const n2 = Object.assign({}, e, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
    return "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret), { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: s2 };
  }
  getAccessToken() {
    return this._getAccessTokenPromiseHub.exec();
  }
  async authorize() {
    await this.getAccessToken();
  }
  callFunction(e) {
    const t2 = { method: "serverless.function.runtime.invoke", params: JSON.stringify({ functionTarget: e.name, functionArgs: e.data || {} }) };
    return this.request(this.setupRequest(t2));
  }
  getOSSUploadOptionsFromPath(e) {
    const t2 = { method: "serverless.file.resource.generateProximalSign", params: JSON.stringify(e) };
    return this.request(this.setupRequest(t2));
  }
  uploadFileToOSS({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
    return new Promise((o2, a2) => {
      const c2 = this.adapter.uploadFile({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, header: { "X-OSS-server-side-encrpytion": "AES256" }, success(e2) {
        e2 && e2.statusCode < 400 ? o2(e2) : a2(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
      }, fail(e2) {
        a2(new ne({ code: e2.code || "UPLOAD_FAILED", message: e2.message || e2.errMsg || "文件上传失败" }));
      } });
      "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e2) => {
        i2({ loaded: e2.totalBytesSent, total: e2.totalBytesExpectedToSend });
      });
    });
  }
  reportOSSUpload(e) {
    const t2 = { method: "serverless.file.resource.report", params: JSON.stringify(e) };
    return this.request(this.setupRequest(t2));
  }
  async uploadFile({ filePath: e, cloudPath: t2, fileType: n2 = "image", cloudPathAsRealPath: s2 = false, onUploadProgress: r2, config: i2 }) {
    if ("string" !== g(t2))
      throw new ne({ code: "INVALID_PARAM", message: "cloudPath必须为字符串类型" });
    if (!(t2 = t2.trim()))
      throw new ne({ code: "INVALID_PARAM", message: "cloudPath不可为空" });
    if (/:\/\//.test(t2))
      throw new ne({ code: "INVALID_PARAM", message: "cloudPath不合法" });
    const o2 = i2 && i2.envType || this.config.envType;
    if (s2 && ("/" !== t2[0] && (t2 = "/" + t2), t2.indexOf("\\") > -1))
      throw new ne({ code: "INVALID_PARAM", message: "使用cloudPath作为路径时，cloudPath不可包含“\\”" });
    const a2 = (await this.getOSSUploadOptionsFromPath({ env: o2, filename: s2 ? t2.split("/").pop() : t2, fileId: s2 ? t2 : void 0 })).result, c2 = "https://" + a2.cdnDomain + "/" + a2.ossPath, { securityToken: u2, accessKeyId: h2, signature: l2, host: d2, ossPath: p2, id: f2, policy: m2, ossCallbackUrl: y2 } = a2, _2 = { "Cache-Control": "max-age=2592000", "Content-Disposition": "attachment", OSSAccessKeyId: h2, Signature: l2, host: d2, id: f2, key: p2, policy: m2, success_action_status: 200 };
    if (u2 && (_2["x-oss-security-token"] = u2), y2) {
      const e2 = JSON.stringify({ callbackUrl: y2, callbackBody: JSON.stringify({ fileId: f2, spaceId: this.config.spaceId }), callbackBodyType: "application/json" });
      _2.callback = de.toBase64(e2);
    }
    const w2 = { url: "https://" + a2.host, formData: _2, fileName: "file", name: "file", filePath: e, fileType: n2 };
    if (await this.uploadFileToOSS(Object.assign({}, w2, { onUploadProgress: r2 })), y2)
      return { success: true, filePath: e, fileID: c2 };
    if ((await this.reportOSSUpload({ id: f2 })).success)
      return { success: true, filePath: e, fileID: c2 };
    throw new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" });
  }
  getTempFileURL({ fileList: e } = {}) {
    return new Promise((t2, n2) => {
      Array.isArray(e) && 0 !== e.length || n2(new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" })), t2({ fileList: e.map((e2) => ({ fileID: e2, tempFileURL: e2 })) });
    });
  }
  async getFileInfo({ fileList: e } = {}) {
    if (!Array.isArray(e) || 0 === e.length)
      throw new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
    const t2 = { method: "serverless.file.resource.info", params: JSON.stringify({ id: e.map((e2) => e2.split("?")[0]).join(",") }) };
    return { fileList: (await this.request(this.setupRequest(t2))).result };
  }
};
var me = { init(e) {
  const t2 = new ge(e), n2 = { signInAnonymously: function() {
    return t2.authorize();
  }, getLoginState: function() {
    return Promise.resolve(false);
  } };
  return t2.auth = function() {
    return n2;
  }, t2.customAuth = t2.auth, t2;
} };
const ye = "undefined" != typeof location && "http:" === location.protocol ? "http:" : "https:";
var _e;
!function(e) {
  e.local = "local", e.none = "none", e.session = "session";
}(_e || (_e = {}));
var we = function() {
};
const ve = () => {
  let e;
  if (!Promise) {
    e = () => {
    }, e.promise = {};
    const t3 = () => {
      throw new ne({ message: 'Your Node runtime does support ES6 Promises. Set "global.Promise" to your preferred implementation of promises.' });
    };
    return Object.defineProperty(e.promise, "then", { get: t3 }), Object.defineProperty(e.promise, "catch", { get: t3 }), e;
  }
  const t2 = new Promise((t3, n2) => {
    e = (e2, s2) => e2 ? n2(e2) : t3(s2);
  });
  return e.promise = t2, e;
};
function Ie(e) {
  return void 0 === e;
}
function Se(e) {
  return "[object Null]" === Object.prototype.toString.call(e);
}
var be;
function ke(e) {
  const t2 = (n2 = e, "[object Array]" === Object.prototype.toString.call(n2) ? e : [e]);
  var n2;
  for (const e2 of t2) {
    const { isMatch: t3, genAdapter: n3, runtime: s2 } = e2;
    if (t3())
      return { adapter: n3(), runtime: s2 };
  }
}
!function(e) {
  e.WEB = "web", e.WX_MP = "wx_mp";
}(be || (be = {}));
const Ce = { adapter: null, runtime: void 0 }, Te = ["anonymousUuidKey"];
class Pe extends we {
  constructor() {
    super(), Ce.adapter.root.tcbObject || (Ce.adapter.root.tcbObject = {});
  }
  setItem(e, t2) {
    Ce.adapter.root.tcbObject[e] = t2;
  }
  getItem(e) {
    return Ce.adapter.root.tcbObject[e];
  }
  removeItem(e) {
    delete Ce.adapter.root.tcbObject[e];
  }
  clear() {
    delete Ce.adapter.root.tcbObject;
  }
}
function Ae(e, t2) {
  switch (e) {
    case "local":
      return t2.localStorage || new Pe();
    case "none":
      return new Pe();
    default:
      return t2.sessionStorage || new Pe();
  }
}
class Ee {
  constructor(e) {
    if (!this._storage) {
      this._persistence = Ce.adapter.primaryStorage || e.persistence, this._storage = Ae(this._persistence, Ce.adapter);
      const t2 = `access_token_${e.env}`, n2 = `access_token_expire_${e.env}`, s2 = `refresh_token_${e.env}`, r2 = `anonymous_uuid_${e.env}`, i2 = `login_type_${e.env}`, o2 = `user_info_${e.env}`;
      this.keys = { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2, anonymousUuidKey: r2, loginTypeKey: i2, userInfoKey: o2 };
    }
  }
  updatePersistence(e) {
    if (e === this._persistence)
      return;
    const t2 = "local" === this._persistence;
    this._persistence = e;
    const n2 = Ae(e, Ce.adapter);
    for (const e2 in this.keys) {
      const s2 = this.keys[e2];
      if (t2 && Te.includes(e2))
        continue;
      const r2 = this._storage.getItem(s2);
      Ie(r2) || Se(r2) || (n2.setItem(s2, r2), this._storage.removeItem(s2));
    }
    this._storage = n2;
  }
  setStore(e, t2, n2) {
    if (!this._storage)
      return;
    const s2 = { version: n2 || "localCachev1", content: t2 }, r2 = JSON.stringify(s2);
    try {
      this._storage.setItem(e, r2);
    } catch (e2) {
      throw e2;
    }
  }
  getStore(e, t2) {
    try {
      if (!this._storage)
        return;
    } catch (e2) {
      return "";
    }
    t2 = t2 || "localCachev1";
    const n2 = this._storage.getItem(e);
    if (!n2)
      return "";
    if (n2.indexOf(t2) >= 0) {
      return JSON.parse(n2).content;
    }
    return "";
  }
  removeStore(e) {
    this._storage.removeItem(e);
  }
}
const Oe = {}, xe = {};
function Re(e) {
  return Oe[e];
}
class Ue {
  constructor(e, t2) {
    this.data = t2 || null, this.name = e;
  }
}
class Le extends Ue {
  constructor(e, t2) {
    super("error", { error: e, data: t2 }), this.error = e;
  }
}
const Ne = new class {
  constructor() {
    this._listeners = {};
  }
  on(e, t2) {
    return function(e2, t3, n2) {
      n2[e2] = n2[e2] || [], n2[e2].push(t3);
    }(e, t2, this._listeners), this;
  }
  off(e, t2) {
    return function(e2, t3, n2) {
      if (n2 && n2[e2]) {
        const s2 = n2[e2].indexOf(t3);
        -1 !== s2 && n2[e2].splice(s2, 1);
      }
    }(e, t2, this._listeners), this;
  }
  fire(e, t2) {
    if (e instanceof Le)
      return console.error(e.error), this;
    const n2 = "string" == typeof e ? new Ue(e, t2 || {}) : e;
    const s2 = n2.name;
    if (this._listens(s2)) {
      n2.target = this;
      const e2 = this._listeners[s2] ? [...this._listeners[s2]] : [];
      for (const t3 of e2)
        t3.call(this, n2);
    }
    return this;
  }
  _listens(e) {
    return this._listeners[e] && this._listeners[e].length > 0;
  }
}();
function De(e, t2) {
  Ne.on(e, t2);
}
function Fe(e, t2 = {}) {
  Ne.fire(e, t2);
}
function Me(e, t2) {
  Ne.off(e, t2);
}
const qe = "loginStateChanged", Ke = "loginStateExpire", je = "loginTypeChanged", Be = "anonymousConverted", $e = "refreshAccessToken";
var We;
!function(e) {
  e.ANONYMOUS = "ANONYMOUS", e.WECHAT = "WECHAT", e.WECHAT_PUBLIC = "WECHAT-PUBLIC", e.WECHAT_OPEN = "WECHAT-OPEN", e.CUSTOM = "CUSTOM", e.EMAIL = "EMAIL", e.USERNAME = "USERNAME", e.NULL = "NULL";
}(We || (We = {}));
const ze = ["auth.getJwt", "auth.logout", "auth.signInWithTicket", "auth.signInAnonymously", "auth.signIn", "auth.fetchAccessTokenWithRefreshToken", "auth.signUpWithEmailAndPassword", "auth.activateEndUserMail", "auth.sendPasswordResetEmail", "auth.resetPasswordWithToken", "auth.isUsernameRegistered"], Je = { "X-SDK-Version": "1.3.5" };
function He(e, t2, n2) {
  const s2 = e[t2];
  e[t2] = function(t3) {
    const r2 = {}, i2 = {};
    n2.forEach((n3) => {
      const { data: s3, headers: o3 } = n3.call(e, t3);
      Object.assign(r2, s3), Object.assign(i2, o3);
    });
    const o2 = t3.data;
    return o2 && (() => {
      var e2;
      if (e2 = o2, "[object FormData]" !== Object.prototype.toString.call(e2))
        t3.data = { ...o2, ...r2 };
      else
        for (const e3 in r2)
          o2.append(e3, r2[e3]);
    })(), t3.headers = { ...t3.headers || {}, ...i2 }, s2.call(e, t3);
  };
}
function Ge() {
  const e = Math.random().toString(16).slice(2);
  return { data: { seqId: e }, headers: { ...Je, "x-seqid": e } };
}
class Ve {
  constructor(e = {}) {
    var t2;
    this.config = e, this._reqClass = new Ce.adapter.reqClass({ timeout: this.config.timeout, timeoutMsg: `请求在${this.config.timeout / 1e3}s内未完成，已中断`, restrictedMethods: ["post"] }), this._cache = Re(this.config.env), this._localCache = (t2 = this.config.env, xe[t2]), He(this._reqClass, "post", [Ge]), He(this._reqClass, "upload", [Ge]), He(this._reqClass, "download", [Ge]);
  }
  async post(e) {
    return await this._reqClass.post(e);
  }
  async upload(e) {
    return await this._reqClass.upload(e);
  }
  async download(e) {
    return await this._reqClass.download(e);
  }
  async refreshAccessToken() {
    let e, t2;
    this._refreshAccessTokenPromise || (this._refreshAccessTokenPromise = this._refreshAccessToken());
    try {
      e = await this._refreshAccessTokenPromise;
    } catch (e2) {
      t2 = e2;
    }
    if (this._refreshAccessTokenPromise = null, this._shouldRefreshAccessTokenHook = null, t2)
      throw t2;
    return e;
  }
  async _refreshAccessToken() {
    const { accessTokenKey: e, accessTokenExpireKey: t2, refreshTokenKey: n2, loginTypeKey: s2, anonymousUuidKey: r2 } = this._cache.keys;
    this._cache.removeStore(e), this._cache.removeStore(t2);
    let i2 = this._cache.getStore(n2);
    if (!i2)
      throw new ne({ message: "未登录CloudBase" });
    const o2 = { refresh_token: i2 }, a2 = await this.request("auth.fetchAccessTokenWithRefreshToken", o2);
    if (a2.data.code) {
      const { code: e2 } = a2.data;
      if ("SIGN_PARAM_INVALID" === e2 || "REFRESH_TOKEN_EXPIRED" === e2 || "INVALID_REFRESH_TOKEN" === e2) {
        if (this._cache.getStore(s2) === We.ANONYMOUS && "INVALID_REFRESH_TOKEN" === e2) {
          const e3 = this._cache.getStore(r2), t3 = this._cache.getStore(n2), s3 = await this.send("auth.signInAnonymously", { anonymous_uuid: e3, refresh_token: t3 });
          return this.setRefreshToken(s3.refresh_token), this._refreshAccessToken();
        }
        Fe(Ke), this._cache.removeStore(n2);
      }
      throw new ne({ code: a2.data.code, message: `刷新access token失败：${a2.data.code}` });
    }
    if (a2.data.access_token)
      return Fe($e), this._cache.setStore(e, a2.data.access_token), this._cache.setStore(t2, a2.data.access_token_expire + Date.now()), { accessToken: a2.data.access_token, accessTokenExpire: a2.data.access_token_expire };
    a2.data.refresh_token && (this._cache.removeStore(n2), this._cache.setStore(n2, a2.data.refresh_token), this._refreshAccessToken());
  }
  async getAccessToken() {
    const { accessTokenKey: e, accessTokenExpireKey: t2, refreshTokenKey: n2 } = this._cache.keys;
    if (!this._cache.getStore(n2))
      throw new ne({ message: "refresh token不存在，登录状态异常" });
    let s2 = this._cache.getStore(e), r2 = this._cache.getStore(t2), i2 = true;
    return this._shouldRefreshAccessTokenHook && !await this._shouldRefreshAccessTokenHook(s2, r2) && (i2 = false), (!s2 || !r2 || r2 < Date.now()) && i2 ? this.refreshAccessToken() : { accessToken: s2, accessTokenExpire: r2 };
  }
  async request(e, t2, n2) {
    const s2 = `x-tcb-trace_${this.config.env}`;
    let r2 = "application/x-www-form-urlencoded";
    const i2 = { action: e, env: this.config.env, dataVersion: "2019-08-16", ...t2 };
    if (-1 === ze.indexOf(e)) {
      const { refreshTokenKey: e2 } = this._cache.keys;
      this._cache.getStore(e2) && (i2.access_token = (await this.getAccessToken()).accessToken);
    }
    let o2;
    if ("storage.uploadFile" === e) {
      o2 = new FormData();
      for (let e2 in o2)
        o2.hasOwnProperty(e2) && void 0 !== o2[e2] && o2.append(e2, i2[e2]);
      r2 = "multipart/form-data";
    } else {
      r2 = "application/json", o2 = {};
      for (let e2 in i2)
        void 0 !== i2[e2] && (o2[e2] = i2[e2]);
    }
    let a2 = { headers: { "content-type": r2 } };
    n2 && n2.onUploadProgress && (a2.onUploadProgress = n2.onUploadProgress);
    const c2 = this._localCache.getStore(s2);
    c2 && (a2.headers["X-TCB-Trace"] = c2);
    const { parse: u2, inQuery: h2, search: l2 } = t2;
    let d2 = { env: this.config.env };
    u2 && (d2.parse = true), h2 && (d2 = { ...h2, ...d2 });
    let p2 = function(e2, t3, n3 = {}) {
      const s3 = /\?/.test(t3);
      let r3 = "";
      for (let e3 in n3)
        "" === r3 ? !s3 && (t3 += "?") : r3 += "&", r3 += `${e3}=${encodeURIComponent(n3[e3])}`;
      return /^http(s)?\:\/\//.test(t3 += r3) ? t3 : `${e2}${t3}`;
    }(ye, "//tcb-api.tencentcloudapi.com/web", d2);
    l2 && (p2 += l2);
    const f2 = await this.post({ url: p2, data: o2, ...a2 }), g2 = f2.header && f2.header["x-tcb-trace"];
    if (g2 && this._localCache.setStore(s2, g2), 200 !== Number(f2.status) && 200 !== Number(f2.statusCode) || !f2.data)
      throw new ne({ code: "NETWORK_ERROR", message: "network request error" });
    return f2;
  }
  async send(e, t2 = {}) {
    const n2 = await this.request(e, t2, { onUploadProgress: t2.onUploadProgress });
    if ("ACCESS_TOKEN_EXPIRED" === n2.data.code && -1 === ze.indexOf(e)) {
      await this.refreshAccessToken();
      const n3 = await this.request(e, t2, { onUploadProgress: t2.onUploadProgress });
      if (n3.data.code)
        throw new ne({ code: n3.data.code, message: n3.data.message });
      return n3.data;
    }
    if (n2.data.code)
      throw new ne({ code: n2.data.code, message: n2.data.message });
    return n2.data;
  }
  setRefreshToken(e) {
    const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
    this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e);
  }
}
const Ye = {};
function Qe(e) {
  return Ye[e];
}
class Xe {
  constructor(e) {
    this.config = e, this._cache = Re(e.env), this._request = Qe(e.env);
  }
  setRefreshToken(e) {
    const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
    this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e);
  }
  setAccessToken(e, t2) {
    const { accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys;
    this._cache.setStore(n2, e), this._cache.setStore(s2, t2);
  }
  async refreshUserInfo() {
    const { data: e } = await this._request.send("auth.getUserInfo", {});
    return this.setLocalUserInfo(e), e;
  }
  setLocalUserInfo(e) {
    const { userInfoKey: t2 } = this._cache.keys;
    this._cache.setStore(t2, e);
  }
}
class Ze {
  constructor(e) {
    if (!e)
      throw new ne({ code: "PARAM_ERROR", message: "envId is not defined" });
    this._envId = e, this._cache = Re(this._envId), this._request = Qe(this._envId), this.setUserInfo();
  }
  linkWithTicket(e) {
    if ("string" != typeof e)
      throw new ne({ code: "PARAM_ERROR", message: "ticket must be string" });
    return this._request.send("auth.linkWithTicket", { ticket: e });
  }
  linkWithRedirect(e) {
    e.signInWithRedirect();
  }
  updatePassword(e, t2) {
    return this._request.send("auth.updatePassword", { oldPassword: t2, newPassword: e });
  }
  updateEmail(e) {
    return this._request.send("auth.updateEmail", { newEmail: e });
  }
  updateUsername(e) {
    if ("string" != typeof e)
      throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
    return this._request.send("auth.updateUsername", { username: e });
  }
  async getLinkedUidList() {
    const { data: e } = await this._request.send("auth.getLinkedUidList", {});
    let t2 = false;
    const { users: n2 } = e;
    return n2.forEach((e2) => {
      e2.wxOpenId && e2.wxPublicId && (t2 = true);
    }), { users: n2, hasPrimaryUid: t2 };
  }
  setPrimaryUid(e) {
    return this._request.send("auth.setPrimaryUid", { uid: e });
  }
  unlink(e) {
    return this._request.send("auth.unlink", { platform: e });
  }
  async update(e) {
    const { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 } = e, { data: a2 } = await this._request.send("auth.updateUserInfo", { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 });
    this.setLocalUserInfo(a2);
  }
  async refresh() {
    const { data: e } = await this._request.send("auth.getUserInfo", {});
    return this.setLocalUserInfo(e), e;
  }
  setUserInfo() {
    const { userInfoKey: e } = this._cache.keys, t2 = this._cache.getStore(e);
    ["uid", "loginType", "openid", "wxOpenId", "wxPublicId", "unionId", "qqMiniOpenId", "email", "hasPassword", "customUserId", "nickName", "gender", "avatarUrl"].forEach((e2) => {
      this[e2] = t2[e2];
    }), this.location = { country: t2.country, province: t2.province, city: t2.city };
  }
  setLocalUserInfo(e) {
    const { userInfoKey: t2 } = this._cache.keys;
    this._cache.setStore(t2, e), this.setUserInfo();
  }
}
class et {
  constructor(e) {
    if (!e)
      throw new ne({ code: "PARAM_ERROR", message: "envId is not defined" });
    this._cache = Re(e);
    const { refreshTokenKey: t2, accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys, r2 = this._cache.getStore(t2), i2 = this._cache.getStore(n2), o2 = this._cache.getStore(s2);
    this.credential = { refreshToken: r2, accessToken: i2, accessTokenExpire: o2 }, this.user = new Ze(e);
  }
  get isAnonymousAuth() {
    return this.loginType === We.ANONYMOUS;
  }
  get isCustomAuth() {
    return this.loginType === We.CUSTOM;
  }
  get isWeixinAuth() {
    return this.loginType === We.WECHAT || this.loginType === We.WECHAT_OPEN || this.loginType === We.WECHAT_PUBLIC;
  }
  get loginType() {
    return this._cache.getStore(this._cache.keys.loginTypeKey);
  }
}
class tt extends Xe {
  async signIn() {
    this._cache.updatePersistence("local");
    const { anonymousUuidKey: e, refreshTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e) || void 0, s2 = this._cache.getStore(t2) || void 0, r2 = await this._request.send("auth.signInAnonymously", { anonymous_uuid: n2, refresh_token: s2 });
    if (r2.uuid && r2.refresh_token) {
      this._setAnonymousUUID(r2.uuid), this.setRefreshToken(r2.refresh_token), await this._request.refreshAccessToken(), Fe(qe), Fe(je, { env: this.config.env, loginType: We.ANONYMOUS, persistence: "local" });
      const e2 = new et(this.config.env);
      return await e2.user.refresh(), e2;
    }
    throw new ne({ message: "匿名登录失败" });
  }
  async linkAndRetrieveDataWithTicket(e) {
    const { anonymousUuidKey: t2, refreshTokenKey: n2 } = this._cache.keys, s2 = this._cache.getStore(t2), r2 = this._cache.getStore(n2), i2 = await this._request.send("auth.linkAndRetrieveDataWithTicket", { anonymous_uuid: s2, refresh_token: r2, ticket: e });
    if (i2.refresh_token)
      return this._clearAnonymousUUID(), this.setRefreshToken(i2.refresh_token), await this._request.refreshAccessToken(), Fe(Be, { env: this.config.env }), Fe(je, { loginType: We.CUSTOM, persistence: "local" }), { credential: { refreshToken: i2.refresh_token } };
    throw new ne({ message: "匿名转化失败" });
  }
  _setAnonymousUUID(e) {
    const { anonymousUuidKey: t2, loginTypeKey: n2 } = this._cache.keys;
    this._cache.removeStore(t2), this._cache.setStore(t2, e), this._cache.setStore(n2, We.ANONYMOUS);
  }
  _clearAnonymousUUID() {
    this._cache.removeStore(this._cache.keys.anonymousUuidKey);
  }
}
class nt extends Xe {
  async signIn(e) {
    if ("string" != typeof e)
      throw new ne({ code: "PARAM_ERROR", message: "ticket must be a string" });
    const { refreshTokenKey: t2 } = this._cache.keys, n2 = await this._request.send("auth.signInWithTicket", { ticket: e, refresh_token: this._cache.getStore(t2) || "" });
    if (n2.refresh_token)
      return this.setRefreshToken(n2.refresh_token), await this._request.refreshAccessToken(), Fe(qe), Fe(je, { env: this.config.env, loginType: We.CUSTOM, persistence: this.config.persistence }), await this.refreshUserInfo(), new et(this.config.env);
    throw new ne({ message: "自定义登录失败" });
  }
}
class st extends Xe {
  async signIn(e, t2) {
    if ("string" != typeof e)
      throw new ne({ code: "PARAM_ERROR", message: "email must be a string" });
    const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: "EMAIL", email: e, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token: i2, access_token_expire: o2 } = s2;
    if (r2)
      return this.setRefreshToken(r2), i2 && o2 ? this.setAccessToken(i2, o2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Fe(qe), Fe(je, { env: this.config.env, loginType: We.EMAIL, persistence: this.config.persistence }), new et(this.config.env);
    throw s2.code ? new ne({ code: s2.code, message: `邮箱登录失败: ${s2.message}` }) : new ne({ message: "邮箱登录失败" });
  }
  async activate(e) {
    return this._request.send("auth.activateEndUserMail", { token: e });
  }
  async resetPasswordWithToken(e, t2) {
    return this._request.send("auth.resetPasswordWithToken", { token: e, newPassword: t2 });
  }
}
class rt extends Xe {
  async signIn(e, t2) {
    if ("string" != typeof e)
      throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
    "string" != typeof t2 && (t2 = "", console.warn("password is empty"));
    const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: We.USERNAME, username: e, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token_expire: i2, access_token: o2 } = s2;
    if (r2)
      return this.setRefreshToken(r2), o2 && i2 ? this.setAccessToken(o2, i2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Fe(qe), Fe(je, { env: this.config.env, loginType: We.USERNAME, persistence: this.config.persistence }), new et(this.config.env);
    throw s2.code ? new ne({ code: s2.code, message: `用户名密码登录失败: ${s2.message}` }) : new ne({ message: "用户名密码登录失败" });
  }
}
class it {
  constructor(e) {
    this.config = e, this._cache = Re(e.env), this._request = Qe(e.env), this._onAnonymousConverted = this._onAnonymousConverted.bind(this), this._onLoginTypeChanged = this._onLoginTypeChanged.bind(this), De(je, this._onLoginTypeChanged);
  }
  get currentUser() {
    const e = this.hasLoginState();
    return e && e.user || null;
  }
  get loginType() {
    return this._cache.getStore(this._cache.keys.loginTypeKey);
  }
  anonymousAuthProvider() {
    return new tt(this.config);
  }
  customAuthProvider() {
    return new nt(this.config);
  }
  emailAuthProvider() {
    return new st(this.config);
  }
  usernameAuthProvider() {
    return new rt(this.config);
  }
  async signInAnonymously() {
    return new tt(this.config).signIn();
  }
  async signInWithEmailAndPassword(e, t2) {
    return new st(this.config).signIn(e, t2);
  }
  signInWithUsernameAndPassword(e, t2) {
    return new rt(this.config).signIn(e, t2);
  }
  async linkAndRetrieveDataWithTicket(e) {
    this._anonymousAuthProvider || (this._anonymousAuthProvider = new tt(this.config)), De(Be, this._onAnonymousConverted);
    return await this._anonymousAuthProvider.linkAndRetrieveDataWithTicket(e);
  }
  async signOut() {
    if (this.loginType === We.ANONYMOUS)
      throw new ne({ message: "匿名用户不支持登出操作" });
    const { refreshTokenKey: e, accessTokenKey: t2, accessTokenExpireKey: n2 } = this._cache.keys, s2 = this._cache.getStore(e);
    if (!s2)
      return;
    const r2 = await this._request.send("auth.logout", { refresh_token: s2 });
    return this._cache.removeStore(e), this._cache.removeStore(t2), this._cache.removeStore(n2), Fe(qe), Fe(je, { env: this.config.env, loginType: We.NULL, persistence: this.config.persistence }), r2;
  }
  async signUpWithEmailAndPassword(e, t2) {
    return this._request.send("auth.signUpWithEmailAndPassword", { email: e, password: t2 });
  }
  async sendPasswordResetEmail(e) {
    return this._request.send("auth.sendPasswordResetEmail", { email: e });
  }
  onLoginStateChanged(e) {
    De(qe, () => {
      const t3 = this.hasLoginState();
      e.call(this, t3);
    });
    const t2 = this.hasLoginState();
    e.call(this, t2);
  }
  onLoginStateExpired(e) {
    De(Ke, e.bind(this));
  }
  onAccessTokenRefreshed(e) {
    De($e, e.bind(this));
  }
  onAnonymousConverted(e) {
    De(Be, e.bind(this));
  }
  onLoginTypeChanged(e) {
    De(je, () => {
      const t2 = this.hasLoginState();
      e.call(this, t2);
    });
  }
  async getAccessToken() {
    return { accessToken: (await this._request.getAccessToken()).accessToken, env: this.config.env };
  }
  hasLoginState() {
    const { refreshTokenKey: e } = this._cache.keys;
    return this._cache.getStore(e) ? new et(this.config.env) : null;
  }
  async isUsernameRegistered(e) {
    if ("string" != typeof e)
      throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
    const { data: t2 } = await this._request.send("auth.isUsernameRegistered", { username: e });
    return t2 && t2.isRegistered;
  }
  getLoginState() {
    return Promise.resolve(this.hasLoginState());
  }
  async signInWithTicket(e) {
    return new nt(this.config).signIn(e);
  }
  shouldRefreshAccessToken(e) {
    this._request._shouldRefreshAccessTokenHook = e.bind(this);
  }
  getUserInfo() {
    return this._request.send("auth.getUserInfo", {}).then((e) => e.code ? e : { ...e.data, requestId: e.seqId });
  }
  getAuthHeader() {
    const { refreshTokenKey: e, accessTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e);
    return { "x-cloudbase-credentials": this._cache.getStore(t2) + "/@@/" + n2 };
  }
  _onAnonymousConverted(e) {
    const { env: t2 } = e.data;
    t2 === this.config.env && this._cache.updatePersistence(this.config.persistence);
  }
  _onLoginTypeChanged(e) {
    const { loginType: t2, persistence: n2, env: s2 } = e.data;
    s2 === this.config.env && (this._cache.updatePersistence(n2), this._cache.setStore(this._cache.keys.loginTypeKey, t2));
  }
}
const ot = function(e, t2) {
  t2 = t2 || ve();
  const n2 = Qe(this.config.env), { cloudPath: s2, filePath: r2, onUploadProgress: i2, fileType: o2 = "image" } = e;
  return n2.send("storage.getUploadMetadata", { path: s2 }).then((e2) => {
    const { data: { url: a2, authorization: c2, token: u2, fileId: h2, cosFileId: l2 }, requestId: d2 } = e2, p2 = { key: s2, signature: c2, "x-cos-meta-fileid": l2, success_action_status: "201", "x-cos-security-token": u2 };
    n2.upload({ url: a2, data: p2, file: r2, name: s2, fileType: o2, onUploadProgress: i2 }).then((e3) => {
      201 === e3.statusCode ? t2(null, { fileID: h2, requestId: d2 }) : t2(new ne({ code: "STORAGE_REQUEST_FAIL", message: `STORAGE_REQUEST_FAIL: ${e3.data}` }));
    }).catch((e3) => {
      t2(e3);
    });
  }).catch((e2) => {
    t2(e2);
  }), t2.promise;
}, at = function(e, t2) {
  t2 = t2 || ve();
  const n2 = Qe(this.config.env), { cloudPath: s2 } = e;
  return n2.send("storage.getUploadMetadata", { path: s2 }).then((e2) => {
    t2(null, e2);
  }).catch((e2) => {
    t2(e2);
  }), t2.promise;
}, ct = function({ fileList: e }, t2) {
  if (t2 = t2 || ve(), !e || !Array.isArray(e))
    return { code: "INVALID_PARAM", message: "fileList必须是非空的数组" };
  for (let t3 of e)
    if (!t3 || "string" != typeof t3)
      return { code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" };
  const n2 = { fileid_list: e };
  return Qe(this.config.env).send("storage.batchDeleteFile", n2).then((e2) => {
    e2.code ? t2(null, e2) : t2(null, { fileList: e2.data.delete_list, requestId: e2.requestId });
  }).catch((e2) => {
    t2(e2);
  }), t2.promise;
}, ut = function({ fileList: e }, t2) {
  t2 = t2 || ve(), e && Array.isArray(e) || t2(null, { code: "INVALID_PARAM", message: "fileList必须是非空的数组" });
  let n2 = [];
  for (let s3 of e)
    "object" == typeof s3 ? (s3.hasOwnProperty("fileID") && s3.hasOwnProperty("maxAge") || t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是包含fileID和maxAge的对象" }), n2.push({ fileid: s3.fileID, max_age: s3.maxAge })) : "string" == typeof s3 ? n2.push({ fileid: s3 }) : t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是字符串" });
  const s2 = { file_list: n2 };
  return Qe(this.config.env).send("storage.batchGetDownloadUrl", s2).then((e2) => {
    e2.code ? t2(null, e2) : t2(null, { fileList: e2.data.download_list, requestId: e2.requestId });
  }).catch((e2) => {
    t2(e2);
  }), t2.promise;
}, ht = async function({ fileID: e }, t2) {
  const n2 = (await ut.call(this, { fileList: [{ fileID: e, maxAge: 600 }] })).fileList[0];
  if ("SUCCESS" !== n2.code)
    return t2 ? t2(n2) : new Promise((e2) => {
      e2(n2);
    });
  const s2 = Qe(this.config.env);
  let r2 = n2.download_url;
  if (r2 = encodeURI(r2), !t2)
    return s2.download({ url: r2 });
  t2(await s2.download({ url: r2 }));
}, lt = function({ name: e, data: t2, query: n2, parse: s2, search: r2 }, i2) {
  const o2 = i2 || ve();
  let a2;
  try {
    a2 = t2 ? JSON.stringify(t2) : "";
  } catch (e2) {
    return Promise.reject(e2);
  }
  if (!e)
    return Promise.reject(new ne({ code: "PARAM_ERROR", message: "函数名不能为空" }));
  const c2 = { inQuery: n2, parse: s2, search: r2, function_name: e, request_data: a2 };
  return Qe(this.config.env).send("functions.invokeFunction", c2).then((e2) => {
    if (e2.code)
      o2(null, e2);
    else {
      let t3 = e2.data.response_data;
      if (s2)
        o2(null, { result: t3, requestId: e2.requestId });
      else
        try {
          t3 = JSON.parse(e2.data.response_data), o2(null, { result: t3, requestId: e2.requestId });
        } catch (e3) {
          o2(new ne({ message: "response data must be json" }));
        }
    }
    return o2.promise;
  }).catch((e2) => {
    o2(e2);
  }), o2.promise;
}, dt = { timeout: 15e3, persistence: "session" }, pt = {};
class ft {
  constructor(e) {
    this.config = e || this.config, this.authObj = void 0;
  }
  init(e) {
    switch (Ce.adapter || (this.requestClient = new Ce.adapter.reqClass({ timeout: e.timeout || 5e3, timeoutMsg: `请求在${(e.timeout || 5e3) / 1e3}s内未完成，已中断` })), this.config = { ...dt, ...e }, true) {
      case this.config.timeout > 6e5:
        console.warn("timeout大于可配置上限[10分钟]，已重置为上限数值"), this.config.timeout = 6e5;
        break;
      case this.config.timeout < 100:
        console.warn("timeout小于可配置下限[100ms]，已重置为下限数值"), this.config.timeout = 100;
    }
    return new ft(this.config);
  }
  auth({ persistence: e } = {}) {
    if (this.authObj)
      return this.authObj;
    const t2 = e || Ce.adapter.primaryStorage || dt.persistence;
    var n2;
    return t2 !== this.config.persistence && (this.config.persistence = t2), function(e2) {
      const { env: t3 } = e2;
      Oe[t3] = new Ee(e2), xe[t3] = new Ee({ ...e2, persistence: "local" });
    }(this.config), n2 = this.config, Ye[n2.env] = new Ve(n2), this.authObj = new it(this.config), this.authObj;
  }
  on(e, t2) {
    return De.apply(this, [e, t2]);
  }
  off(e, t2) {
    return Me.apply(this, [e, t2]);
  }
  callFunction(e, t2) {
    return lt.apply(this, [e, t2]);
  }
  deleteFile(e, t2) {
    return ct.apply(this, [e, t2]);
  }
  getTempFileURL(e, t2) {
    return ut.apply(this, [e, t2]);
  }
  downloadFile(e, t2) {
    return ht.apply(this, [e, t2]);
  }
  uploadFile(e, t2) {
    return ot.apply(this, [e, t2]);
  }
  getUploadMetadata(e, t2) {
    return at.apply(this, [e, t2]);
  }
  registerExtension(e) {
    pt[e.name] = e;
  }
  async invokeExtension(e, t2) {
    const n2 = pt[e];
    if (!n2)
      throw new ne({ message: `扩展${e} 必须先注册` });
    return await n2.invoke(t2, this);
  }
  useAdapters(e) {
    const { adapter: t2, runtime: n2 } = ke(e) || {};
    t2 && (Ce.adapter = t2), n2 && (Ce.runtime = n2);
  }
}
var gt = new ft();
function mt(e, t2, n2) {
  void 0 === n2 && (n2 = {});
  var s2 = /\?/.test(t2), r2 = "";
  for (var i2 in n2)
    "" === r2 ? !s2 && (t2 += "?") : r2 += "&", r2 += i2 + "=" + encodeURIComponent(n2[i2]);
  return /^http(s)?:\/\//.test(t2 += r2) ? t2 : "" + e + t2;
}
class yt {
  post(e) {
    const { url: t2, data: n2, headers: s2 } = e;
    return new Promise((e2, r2) => {
      se.request({ url: mt("https:", t2), data: n2, method: "POST", header: s2, success(t3) {
        e2(t3);
      }, fail(e3) {
        r2(e3);
      } });
    });
  }
  upload(e) {
    return new Promise((t2, n2) => {
      const { url: s2, file: r2, data: i2, headers: o2, fileType: a2 } = e, c2 = se.uploadFile({ url: mt("https:", s2), name: "file", formData: Object.assign({}, i2), filePath: r2, fileType: a2, header: o2, success(e2) {
        const n3 = { statusCode: e2.statusCode, data: e2.data || {} };
        200 === e2.statusCode && i2.success_action_status && (n3.statusCode = parseInt(i2.success_action_status, 10)), t2(n3);
      }, fail(e2) {
        n2(new Error(e2.errMsg || "uploadFile:fail"));
      } });
      "function" == typeof e.onUploadProgress && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((t3) => {
        e.onUploadProgress({ loaded: t3.totalBytesSent, total: t3.totalBytesExpectedToSend });
      });
    });
  }
}
const _t = { setItem(e, t2) {
  se.setStorageSync(e, t2);
}, getItem: (e) => se.getStorageSync(e), removeItem(e) {
  se.removeStorageSync(e);
}, clear() {
  se.clearStorageSync();
} };
var wt = { genAdapter: function() {
  return { root: {}, reqClass: yt, localStorage: _t, primaryStorage: "local" };
}, isMatch: function() {
  return true;
}, runtime: "uni_app" };
gt.useAdapters(wt);
const vt = gt, It = vt.init;
vt.init = function(e) {
  e.env = e.spaceId;
  const t2 = It.call(this, e);
  t2.config.provider = "tencent", t2.config.spaceId = e.spaceId;
  const n2 = t2.auth;
  return t2.auth = function(e2) {
    const t3 = n2.call(this, e2);
    return ["linkAndRetrieveDataWithTicket", "signInAnonymously", "signOut", "getAccessToken", "getLoginState", "signInWithTicket", "getUserInfo"].forEach((e3) => {
      var n3;
      t3[e3] = (n3 = t3[e3], function(e4) {
        e4 = e4 || {};
        const { success: t4, fail: s2, complete: r2 } = te(e4);
        if (!(t4 || s2 || r2))
          return n3.call(this, e4);
        n3.call(this, e4).then((e5) => {
          t4 && t4(e5), r2 && r2(e5);
        }, (e5) => {
          s2 && s2(e5), r2 && r2(e5);
        });
      }).bind(t3);
    }), t3;
  }, t2.customAuth = t2.auth, t2;
};
var St = vt;
var bt = class extends ge {
  getAccessToken() {
    return new Promise((e, t2) => {
      const n2 = "Anonymous_Access_token";
      this.setAccessToken(n2), e(n2);
    });
  }
  setupRequest(e, t2) {
    const n2 = Object.assign({}, e, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
    "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret);
    const r2 = le();
    s2["x-client-info"] = encodeURIComponent(JSON.stringify(r2));
    const { token: i2 } = ie();
    return s2["x-client-token"] = i2, { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: JSON.parse(JSON.stringify(s2)) };
  }
  uploadFileToOSS({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
    return new Promise((o2, a2) => {
      const c2 = this.adapter.uploadFile({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, success(e2) {
        e2 && e2.statusCode < 400 ? o2(e2) : a2(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
      }, fail(e2) {
        a2(new ne({ code: e2.code || "UPLOAD_FAILED", message: e2.message || e2.errMsg || "文件上传失败" }));
      } });
      "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e2) => {
        i2({ loaded: e2.totalBytesSent, total: e2.totalBytesExpectedToSend });
      });
    });
  }
  uploadFile({ filePath: e, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2 }) {
    if (!t2)
      throw new ne({ code: "CLOUDPATH_REQUIRED", message: "cloudPath不可为空" });
    let r2;
    return this.getOSSUploadOptionsFromPath({ cloudPath: t2 }).then((t3) => {
      const { url: i2, formData: o2, name: a2 } = t3.result;
      r2 = t3.result.fileUrl;
      const c2 = { url: i2, formData: o2, name: a2, filePath: e, fileType: n2 };
      return this.uploadFileToOSS(Object.assign({}, c2, { onUploadProgress: s2 }));
    }).then(() => this.reportOSSUpload({ cloudPath: t2 })).then((t3) => new Promise((n3, s3) => {
      t3.success ? n3({ success: true, filePath: e, fileID: r2 }) : s3(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
    }));
  }
  deleteFile({ fileList: e }) {
    const t2 = { method: "serverless.file.resource.delete", params: JSON.stringify({ fileList: e }) };
    return this.request(this.setupRequest(t2)).then((e2) => {
      if (e2.success)
        return e2.result;
      throw new ne({ code: "DELETE_FILE_FAILED", message: "删除文件失败" });
    });
  }
  getTempFileURL({ fileList: e } = {}) {
    if (!Array.isArray(e) || 0 === e.length)
      throw new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
    const t2 = { method: "serverless.file.resource.getTempFileURL", params: JSON.stringify({ fileList: e }) };
    return this.request(this.setupRequest(t2)).then((e2) => {
      if (e2.success)
        return { fileList: e2.result.fileList.map((e3) => ({ fileID: e3.fileID, tempFileURL: e3.tempFileURL })) };
      throw new ne({ code: "GET_TEMP_FILE_URL_FAILED", message: "获取临时文件链接失败" });
    });
  }
};
var kt = { init(e) {
  const t2 = new bt(e), n2 = { signInAnonymously: function() {
    return t2.authorize();
  }, getLoginState: function() {
    return Promise.resolve(false);
  } };
  return t2.auth = function() {
    return n2;
  }, t2.customAuth = t2.auth, t2;
} };
function Ct({ data: e }) {
  let t2;
  t2 = le();
  const n2 = JSON.parse(JSON.stringify(e || {}));
  if (Object.assign(n2, { clientInfo: t2 }), !n2.uniIdToken) {
    const { token: e2 } = ie();
    e2 && (n2.uniIdToken = e2);
  }
  return n2;
}
async function Tt({ name: e, data: t2 } = {}) {
  await this.__dev__.initLocalNetwork();
  const { localAddress: n2, localPort: s2 } = this.__dev__, r2 = { aliyun: "aliyun", tencent: "tcb" }[this.config.provider], i2 = this.config.spaceId, o2 = `http://${n2}:${s2}/system/check-function`, a2 = `http://${n2}:${s2}/cloudfunctions/${e}`;
  return new Promise((t3, n3) => {
    se.request({ method: "POST", url: o2, data: { name: e, platform: P, provider: r2, spaceId: i2 }, timeout: 3e3, success(e2) {
      t3(e2);
    }, fail() {
      t3({ data: { code: "NETWORK_ERROR", message: "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下，自动切换为已部署的云函数。" } });
    } });
  }).then(({ data: e2 } = {}) => {
    const { code: t3, message: n3 } = e2 || {};
    return { code: 0 === t3 ? 0 : t3 || "SYS_ERR", message: n3 || "SYS_ERR" };
  }).then(({ code: n3, message: s3 }) => {
    if (0 !== n3) {
      switch (n3) {
        case "MODULE_ENCRYPTED":
          console.error(`此云函数（${e}）依赖加密公共模块不可本地调试，自动切换为云端已部署的云函数`);
          break;
        case "FUNCTION_ENCRYPTED":
          console.error(`此云函数（${e}）已加密不可本地调试，自动切换为云端已部署的云函数`);
          break;
        case "ACTION_ENCRYPTED":
          console.error(s3 || "需要访问加密的uni-clientDB-action，自动切换为云端环境");
          break;
        case "NETWORK_ERROR": {
          const e2 = "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下";
          throw console.error(e2), new Error(e2);
        }
        case "SWITCH_TO_CLOUD":
          break;
        default: {
          const e2 = `检测本地调试服务出现错误：${s3}，请检查网络环境或重启客户端再试`;
          throw console.error(e2), new Error(e2);
        }
      }
      return this._callCloudFunction({ name: e, data: t2 });
    }
    return new Promise((e2, n4) => {
      const s4 = Ct.call(this, { data: t2 });
      se.request({ method: "POST", url: a2, data: { provider: r2, platform: P, param: s4 }, success: ({ statusCode: t3, data: s5 } = {}) => !t3 || t3 >= 400 ? n4(new ne({ code: s5.code || "SYS_ERR", message: s5.message || "request:fail" })) : e2({ result: s5 }), fail(e3) {
        n4(new ne({ code: e3.code || e3.errCode || "SYS_ERR", message: e3.message || e3.errMsg || "request:fail" }));
      } });
    });
  });
}
const Pt = [{ rule: /fc_function_not_found|FUNCTION_NOT_FOUND/, content: "，云函数[{functionName}]在云端不存在，请检查此云函数名称是否正确以及该云函数是否已上传到服务空间", mode: "append" }];
var At = /[\\^$.*+?()[\]{}|]/g, Et = RegExp(At.source);
function Ot(e, t2, n2) {
  return e.replace(new RegExp((s2 = t2) && Et.test(s2) ? s2.replace(At, "\\$&") : s2, "g"), n2);
  var s2;
}
const Rt = "request", Ut = "response", Lt = "both";
const yn = { code: 2e4, message: "System error" }, _n = { code: 20101, message: "Invalid client" };
function In(e) {
  const { errSubject: t2, subject: n2, errCode: s2, errMsg: r2, code: i2, message: o2, cause: a2 } = e || {};
  return new ne({ subject: t2 || n2 || "uni-secure-network", code: s2 || i2 || yn.code, message: r2 || o2, cause: a2 });
}
let bn;
function An({ secretType: e } = {}) {
  return e === Rt || e === Ut || e === Lt;
}
function En({ name: e, data: t2 = {} } = {}) {
  return "DCloud-clientDB" === e && "encryption" === t2.redirectTo && "getAppClientKey" === t2.action;
}
function On({ provider: e, spaceId: t2, functionName: n2 } = {}) {
  const { appId: s2, uniPlatform: r2, osName: i2 } = ue();
  let o2 = r2;
  "app" === r2 && (o2 = i2);
  const a2 = function({ provider: e2, spaceId: t3 } = {}) {
    const n3 = T;
    if (!n3)
      return {};
    e2 = function(e3) {
      return "tencent" === e3 ? "tcb" : e3;
    }(e2);
    const s3 = n3.find((n4) => n4.provider === e2 && n4.spaceId === t3);
    return s3 && s3.config;
  }({ provider: e, spaceId: t2 });
  if (!a2 || !a2.accessControl || !a2.accessControl.enable)
    return false;
  const c2 = a2.accessControl.function || {}, u2 = Object.keys(c2);
  if (0 === u2.length)
    return true;
  const h2 = function(e2, t3) {
    let n3, s3, r3;
    for (let i3 = 0; i3 < e2.length; i3++) {
      const o3 = e2[i3];
      o3 !== t3 ? "*" !== o3 ? o3.split(",").map((e3) => e3.trim()).indexOf(t3) > -1 && (s3 = o3) : r3 = o3 : n3 = o3;
    }
    return n3 || s3 || r3;
  }(u2, n2);
  if (!h2)
    return false;
  if ((c2[h2] || []).find((e2 = {}) => e2.appId === s2 && (e2.platform || "").toLowerCase() === o2.toLowerCase()))
    return true;
  throw console.error(`此应用[appId: ${s2}, platform: ${o2}]不在云端配置的允许访问的应用列表内，参考：https://uniapp.dcloud.net.cn/uniCloud/secure-network.html#verify-client`), In(_n);
}
function xn({ functionName: e, result: t2, logPvd: n2 }) {
  if (this.__dev__.debugLog && t2 && t2.requestId) {
    const s2 = JSON.stringify({ spaceId: this.config.spaceId, functionName: e, requestId: t2.requestId });
    console.log(`[${n2}-request]${s2}[/${n2}-request]`);
  }
}
function Rn(e) {
  const t2 = e.callFunction, n2 = function(n3) {
    const s2 = n3.name;
    n3.data = Ct.call(e, { data: n3.data });
    const r2 = { aliyun: "aliyun", tencent: "tcb", tcb: "tcb" }[this.config.provider], i2 = An(n3), o2 = En(n3), a2 = i2 || o2;
    return t2.call(this, n3).then((e2) => (e2.errCode = 0, !a2 && xn.call(this, { functionName: s2, result: e2, logPvd: r2 }), Promise.resolve(e2)), (e2) => (!a2 && xn.call(this, { functionName: s2, result: e2, logPvd: r2 }), e2 && e2.message && (e2.message = function({ message: e3 = "", extraInfo: t3 = {}, formatter: n4 = [] } = {}) {
      for (let s3 = 0; s3 < n4.length; s3++) {
        const { rule: r3, content: i3, mode: o3 } = n4[s3], a3 = e3.match(r3);
        if (!a3)
          continue;
        let c2 = i3;
        for (let e4 = 1; e4 < a3.length; e4++)
          c2 = Ot(c2, `{$${e4}}`, a3[e4]);
        for (const e4 in t3)
          c2 = Ot(c2, `{${e4}}`, t3[e4]);
        return "replace" === o3 ? c2 : e3 + c2;
      }
      return e3;
    }({ message: `[${n3.name}]: ${e2.message}`, formatter: Pt, extraInfo: { functionName: s2 } })), Promise.reject(e2)));
  };
  e.callFunction = function(t3) {
    const { provider: s2, spaceId: r2 } = e.config, i2 = t3.name;
    let o2, a2;
    if (t3.data = t3.data || {}, e.__dev__.debugInfo && !e.__dev__.debugInfo.forceRemote && E ? (e._callCloudFunction || (e._callCloudFunction = n2, e._callLocalFunction = Tt), o2 = Tt) : o2 = n2, o2 = o2.bind(e), En(t3))
      a2 = n2.call(e, t3);
    else if (An(t3)) {
      a2 = new bn({ secretType: t3.secretType, uniCloudIns: e }).wrapEncryptDataCallFunction(n2.bind(e))(t3);
    } else if (On({ provider: s2, spaceId: r2, functionName: i2 })) {
      a2 = new bn({ secretType: t3.secretType, uniCloudIns: e }).wrapVerifyClientCallFunction(n2.bind(e))(t3);
    } else
      a2 = o2(t3);
    return Object.defineProperty(a2, "result", { get: () => (console.warn("当前返回结果为Promise类型，不可直接访问其result属性，详情请参考：https://uniapp.dcloud.net.cn/uniCloud/faq?id=promise"), {}) }), a2;
  };
}
bn = class {
  constructor() {
    throw In({ message: `Platform ${P} is not enabled, please check whether secure network module is enabled in your manifest.json` });
  }
};
const Un = Symbol("CLIENT_DB_INTERNAL");
function Ln(e, t2) {
  return e.then = "DoNotReturnProxyWithAFunctionNamedThen", e._internalType = Un, e.inspect = null, e.__v_raw = void 0, new Proxy(e, { get(e2, n2, s2) {
    if ("_uniClient" === n2)
      return null;
    if ("symbol" == typeof n2)
      return e2[n2];
    if (n2 in e2 || "string" != typeof n2) {
      const t3 = e2[n2];
      return "function" == typeof t3 ? t3.bind(e2) : t3;
    }
    return t2.get(e2, n2, s2);
  } });
}
function Nn(e) {
  return { on: (t2, n2) => {
    e[t2] = e[t2] || [], e[t2].indexOf(n2) > -1 || e[t2].push(n2);
  }, off: (t2, n2) => {
    e[t2] = e[t2] || [];
    const s2 = e[t2].indexOf(n2);
    -1 !== s2 && e[t2].splice(s2, 1);
  } };
}
const Dn = ["db.Geo", "db.command", "command.aggregate"];
function Fn(e, t2) {
  return Dn.indexOf(`${e}.${t2}`) > -1;
}
function Mn(e) {
  switch (g(e = re(e))) {
    case "array":
      return e.map((e2) => Mn(e2));
    case "object":
      return e._internalType === Un || Object.keys(e).forEach((t2) => {
        e[t2] = Mn(e[t2]);
      }), e;
    case "regexp":
      return { $regexp: { source: e.source, flags: e.flags } };
    case "date":
      return { $date: e.toISOString() };
    default:
      return e;
  }
}
function qn(e) {
  return e && e.content && e.content.$method;
}
class Kn {
  constructor(e, t2, n2) {
    this.content = e, this.prevStage = t2 || null, this.udb = null, this._database = n2;
  }
  toJSON() {
    let e = this;
    const t2 = [e.content];
    for (; e.prevStage; )
      e = e.prevStage, t2.push(e.content);
    return { $db: t2.reverse().map((e2) => ({ $method: e2.$method, $param: Mn(e2.$param) })) };
  }
  toString() {
    return JSON.stringify(this.toJSON());
  }
  getAction() {
    const e = this.toJSON().$db.find((e2) => "action" === e2.$method);
    return e && e.$param && e.$param[0];
  }
  getCommand() {
    return { $db: this.toJSON().$db.filter((e) => "action" !== e.$method) };
  }
  get isAggregate() {
    let e = this;
    for (; e; ) {
      const t2 = qn(e), n2 = qn(e.prevStage);
      if ("aggregate" === t2 && "collection" === n2 || "pipeline" === t2)
        return true;
      e = e.prevStage;
    }
    return false;
  }
  get isCommand() {
    let e = this;
    for (; e; ) {
      if ("command" === qn(e))
        return true;
      e = e.prevStage;
    }
    return false;
  }
  get isAggregateCommand() {
    let e = this;
    for (; e; ) {
      const t2 = qn(e), n2 = qn(e.prevStage);
      if ("aggregate" === t2 && "command" === n2)
        return true;
      e = e.prevStage;
    }
    return false;
  }
  getNextStageFn(e) {
    const t2 = this;
    return function() {
      return jn({ $method: e, $param: Mn(Array.from(arguments)) }, t2, t2._database);
    };
  }
  get count() {
    return this.isAggregate ? this.getNextStageFn("count") : function() {
      return this._send("count", Array.from(arguments));
    };
  }
  get remove() {
    return this.isCommand ? this.getNextStageFn("remove") : function() {
      return this._send("remove", Array.from(arguments));
    };
  }
  get() {
    return this._send("get", Array.from(arguments));
  }
  get add() {
    return this.isCommand ? this.getNextStageFn("add") : function() {
      return this._send("add", Array.from(arguments));
    };
  }
  update() {
    return this._send("update", Array.from(arguments));
  }
  end() {
    return this._send("end", Array.from(arguments));
  }
  get set() {
    return this.isCommand ? this.getNextStageFn("set") : function() {
      throw new Error("JQL禁止使用set方法");
    };
  }
  _send(e, t2) {
    const n2 = this.getAction(), s2 = this.getCommand();
    if (s2.$db.push({ $method: e, $param: Mn(t2) }), b) {
      const e2 = s2.$db.find((e3) => "collection" === e3.$method), t3 = e2 && e2.$param;
      t3 && 1 === t3.length && "string" == typeof e2.$param[0] && e2.$param[0].indexOf(",") > -1 && console.warn("检测到使用JQL语法联表查询时，未使用getTemp先过滤主表数据，在主表数据量大的情况下可能会查询缓慢。\n- 如何优化请参考此文档：https://uniapp.dcloud.net.cn/uniCloud/jql?id=lookup-with-temp \n- 如果主表数据量很小请忽略此信息，项目发行时不会出现此提示。");
    }
    return this._database._callCloudFunction({ action: n2, command: s2 });
  }
}
function jn(e, t2, n2) {
  return Ln(new Kn(e, t2, n2), { get(e2, t3) {
    let s2 = "db";
    return e2 && e2.content && (s2 = e2.content.$method), Fn(s2, t3) ? jn({ $method: t3 }, e2, n2) : function() {
      return jn({ $method: t3, $param: Mn(Array.from(arguments)) }, e2, n2);
    };
  } });
}
function Bn({ path: e, method: t2 }) {
  return class {
    constructor() {
      this.param = Array.from(arguments);
    }
    toJSON() {
      return { $newDb: [...e.map((e2) => ({ $method: e2 })), { $method: t2, $param: this.param }] };
    }
    toString() {
      return JSON.stringify(this.toJSON());
    }
  };
}
function $n(e, t2 = {}) {
  return Ln(new e(t2), { get: (e2, t3) => Fn("db", t3) ? jn({ $method: t3 }, null, e2) : function() {
    return jn({ $method: t3, $param: Mn(Array.from(arguments)) }, null, e2);
  } });
}
class Wn extends class {
  constructor({ uniClient: e = {}, isJQL: t2 = false } = {}) {
    this._uniClient = e, this._authCallBacks = {}, this._dbCallBacks = {}, e._isDefault && (this._dbCallBacks = U("_globalUniCloudDatabaseCallback")), t2 || (this.auth = Nn(this._authCallBacks)), this._isJQL = t2, Object.assign(this, Nn(this._dbCallBacks)), this.env = Ln({}, { get: (e2, t3) => ({ $env: t3 }) }), this.Geo = Ln({}, { get: (e2, t3) => Bn({ path: ["Geo"], method: t3 }) }), this.serverDate = Bn({ path: [], method: "serverDate" }), this.RegExp = Bn({ path: [], method: "RegExp" });
  }
  getCloudEnv(e) {
    if ("string" != typeof e || !e.trim())
      throw new Error("getCloudEnv参数错误");
    return { $env: e.replace("$cloudEnv_", "") };
  }
  _callback(e, t2) {
    const n2 = this._dbCallBacks;
    n2[e] && n2[e].forEach((e2) => {
      e2(...t2);
    });
  }
  _callbackAuth(e, t2) {
    const n2 = this._authCallBacks;
    n2[e] && n2[e].forEach((e2) => {
      e2(...t2);
    });
  }
  multiSend() {
    const e = Array.from(arguments), t2 = e.map((e2) => {
      const t3 = e2.getAction(), n2 = e2.getCommand();
      if ("getTemp" !== n2.$db[n2.$db.length - 1].$method)
        throw new Error("multiSend只支持子命令内使用getTemp");
      return { action: t3, command: n2 };
    });
    return this._callCloudFunction({ multiCommand: t2, queryList: e });
  }
} {
  _parseResult(e) {
    return this._isJQL ? e.result : e;
  }
  _callCloudFunction({ action: e, command: t2, multiCommand: n2, queryList: s2 }) {
    function r2(e2, t3) {
      if (n2 && s2)
        for (let n3 = 0; n3 < s2.length; n3++) {
          const r3 = s2[n3];
          r3.udb && "function" == typeof r3.udb.setResult && (t3 ? r3.udb.setResult(t3) : r3.udb.setResult(e2.result.dataList[n3]));
        }
    }
    const i2 = this, o2 = this._isJQL ? "databaseForJQL" : "database";
    function a2(e2) {
      return i2._callback("error", [e2]), M(q(o2, "fail"), e2).then(() => M(q(o2, "complete"), e2)).then(() => (r2(null, e2), Q(B, { type: z, content: e2 }), Promise.reject(e2)));
    }
    const c2 = M(q(o2, "invoke")), u2 = this._uniClient;
    return c2.then(() => u2.callFunction({ name: "DCloud-clientDB", type: l, data: { action: e, command: t2, multiCommand: n2 } })).then((e2) => {
      const { code: t3, message: n3, token: s3, tokenExpired: c3, systemInfo: u3 = [] } = e2.result;
      if (u3)
        for (let e3 = 0; e3 < u3.length; e3++) {
          const { level: t4, message: n4, detail: s4 } = u3[e3], r3 = console["warn" === t4 ? "error" : t4] || console.log;
          let i3 = "[System Info]" + n4;
          s4 && (i3 = `${i3}
详细信息：${s4}`), r3(i3);
        }
      if (t3) {
        return a2(new ne({ code: t3, message: n3, requestId: e2.requestId }));
      }
      e2.result.errCode = e2.result.errCode || e2.result.code, e2.result.errMsg = e2.result.errMsg || e2.result.message, s3 && c3 && (oe({ token: s3, tokenExpired: c3 }), this._callbackAuth("refreshToken", [{ token: s3, tokenExpired: c3 }]), this._callback("refreshToken", [{ token: s3, tokenExpired: c3 }]), Q(W, { token: s3, tokenExpired: c3 }));
      const h2 = [{ prop: "affectedDocs", tips: "affectedDocs不再推荐使用，请使用inserted/deleted/updated/data.length替代" }, { prop: "code", tips: "code不再推荐使用，请使用errCode替代" }, { prop: "message", tips: "message不再推荐使用，请使用errMsg替代" }];
      for (let t4 = 0; t4 < h2.length; t4++) {
        const { prop: n4, tips: s4 } = h2[t4];
        if (n4 in e2.result) {
          const t5 = e2.result[n4];
          Object.defineProperty(e2.result, n4, { get: () => (console.warn(s4), t5) });
        }
      }
      return function(e3) {
        return M(q(o2, "success"), e3).then(() => M(q(o2, "complete"), e3)).then(() => {
          r2(e3, null);
          const t4 = i2._parseResult(e3);
          return Q(B, { type: z, content: t4 }), Promise.resolve(t4);
        });
      }(e2);
    }, (e2) => {
      /fc_function_not_found|FUNCTION_NOT_FOUND/g.test(e2.message) && console.warn("clientDB未初始化，请在web控制台保存一次schema以开启clientDB");
      return a2(new ne({ code: e2.code || "SYSTEM_ERROR", message: e2.message, requestId: e2.requestId }));
    });
  }
}
const zn = "token无效，跳转登录页面", Jn = "token过期，跳转登录页面", Hn = { TOKEN_INVALID_TOKEN_EXPIRED: Jn, TOKEN_INVALID_INVALID_CLIENTID: zn, TOKEN_INVALID: zn, TOKEN_INVALID_WRONG_TOKEN: zn, TOKEN_INVALID_ANONYMOUS_USER: zn }, Gn = { "uni-id-token-expired": Jn, "uni-id-check-token-failed": zn, "uni-id-token-not-exist": zn, "uni-id-check-device-feature-failed": zn };
function Vn(e, t2) {
  let n2 = "";
  return n2 = e ? `${e}/${t2}` : t2, n2.replace(/^\//, "");
}
function Yn(e = [], t2 = "") {
  const n2 = [], s2 = [];
  return e.forEach((e2) => {
    true === e2.needLogin ? n2.push(Vn(t2, e2.path)) : false === e2.needLogin && s2.push(Vn(t2, e2.path));
  }), { needLoginPage: n2, notNeedLoginPage: s2 };
}
function Qn(e) {
  return e.split("?")[0].replace(/^\//, "");
}
function Xn() {
  return function(e) {
    let t2 = e && e.$page && e.$page.fullPath || "";
    return t2 ? ("/" !== t2.charAt(0) && (t2 = "/" + t2), t2) : t2;
  }(function() {
    const e = getCurrentPages();
    return e[e.length - 1];
  }());
}
function Zn() {
  return Qn(Xn());
}
function es$1(e = "", t2 = {}) {
  if (!e)
    return false;
  if (!(t2 && t2.list && t2.list.length))
    return false;
  const n2 = t2.list, s2 = Qn(e);
  return n2.some((e2) => e2.pagePath === s2);
}
const ts = !!t$1.uniIdRouter;
const { loginPage: ns, routerNeedLogin: ss, resToLogin: rs, needLoginPage: is, notNeedLoginPage: os, loginPageInTabBar: as } = function({ pages: e = [], subPackages: n2 = [], uniIdRouter: s2 = {}, tabBar: r2 = {} } = t$1) {
  const { loginPage: i2, needLogin: o2 = [], resToLogin: a2 = true } = s2, { needLoginPage: c2, notNeedLoginPage: u2 } = Yn(e), { needLoginPage: h2, notNeedLoginPage: l2 } = function(e2 = []) {
    const t2 = [], n3 = [];
    return e2.forEach((e3) => {
      const { root: s3, pages: r3 = [] } = e3, { needLoginPage: i3, notNeedLoginPage: o3 } = Yn(r3, s3);
      t2.push(...i3), n3.push(...o3);
    }), { needLoginPage: t2, notNeedLoginPage: n3 };
  }(n2);
  return { loginPage: i2, routerNeedLogin: o2, resToLogin: a2, needLoginPage: [...c2, ...h2], notNeedLoginPage: [...u2, ...l2], loginPageInTabBar: es$1(i2, r2) };
}();
if (is.indexOf(ns) > -1)
  throw new Error(`Login page [${ns}] should not be "needLogin", please check your pages.json`);
function cs(e) {
  const t2 = Zn();
  if ("/" === e.charAt(0))
    return e;
  const [n2, s2] = e.split("?"), r2 = n2.replace(/^\//, "").split("/"), i2 = t2.split("/");
  i2.pop();
  for (let e2 = 0; e2 < r2.length; e2++) {
    const t3 = r2[e2];
    ".." === t3 ? i2.pop() : "." !== t3 && i2.push(t3);
  }
  return "" === i2[0] && i2.shift(), "/" + i2.join("/") + (s2 ? "?" + s2 : "");
}
function us(e) {
  const t2 = Qn(cs(e));
  return !(os.indexOf(t2) > -1) && (is.indexOf(t2) > -1 || ss.some((t3) => function(e2, t4) {
    return new RegExp(t4).test(e2);
  }(e, t3)));
}
function hs({ redirect: e }) {
  const t2 = Qn(e), n2 = Qn(ns);
  return Zn() !== n2 && t2 !== n2;
}
function ls({ api: e, redirect: t2 } = {}) {
  if (!t2 || !hs({ redirect: t2 }))
    return;
  const n2 = function(e2, t3) {
    return "/" !== e2.charAt(0) && (e2 = "/" + e2), t3 ? e2.indexOf("?") > -1 ? e2 + `&uniIdRedirectUrl=${encodeURIComponent(t3)}` : e2 + `?uniIdRedirectUrl=${encodeURIComponent(t3)}` : e2;
  }(ns, t2);
  as ? "navigateTo" !== e && "redirectTo" !== e || (e = "switchTab") : "switchTab" === e && (e = "navigateTo");
  const s2 = { navigateTo: uni.navigateTo, redirectTo: uni.redirectTo, switchTab: uni.switchTab, reLaunch: uni.reLaunch };
  setTimeout(() => {
    s2[e]({ url: n2 });
  });
}
function ds({ url: e } = {}) {
  const t2 = { abortLoginPageJump: false, autoToLoginPage: false }, n2 = function() {
    const { token: e2, tokenExpired: t3 } = ie();
    let n3;
    if (e2) {
      if (t3 < Date.now()) {
        const e3 = "uni-id-token-expired";
        n3 = { errCode: e3, errMsg: Gn[e3] };
      }
    } else {
      const e3 = "uni-id-check-token-failed";
      n3 = { errCode: e3, errMsg: Gn[e3] };
    }
    return n3;
  }();
  if (us(e) && n2) {
    n2.uniIdRedirectUrl = e;
    if (G($).length > 0)
      return setTimeout(() => {
        Q($, n2);
      }, 0), t2.abortLoginPageJump = true, t2;
    t2.autoToLoginPage = true;
  }
  return t2;
}
function ps() {
  !function() {
    const e2 = Xn(), { abortLoginPageJump: t2, autoToLoginPage: n2 } = ds({ url: e2 });
    t2 || n2 && ls({ api: "redirectTo", redirect: e2 });
  }();
  const e = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
  for (let t2 = 0; t2 < e.length; t2++) {
    const n2 = e[t2];
    uni.addInterceptor(n2, { invoke(e2) {
      const { abortLoginPageJump: t3, autoToLoginPage: s2 } = ds({ url: e2.url });
      return t3 ? e2 : s2 ? (ls({ api: n2, redirect: cs(e2.url) }), false) : e2;
    } });
  }
}
function fs() {
  this.onResponse((e) => {
    const { type: t2, content: n2 } = e;
    let s2 = false;
    switch (t2) {
      case "cloudobject":
        s2 = function(e2) {
          if ("object" != typeof e2)
            return false;
          const { errCode: t3 } = e2 || {};
          return t3 in Gn;
        }(n2);
        break;
      case "clientdb":
        s2 = function(e2) {
          if ("object" != typeof e2)
            return false;
          const { errCode: t3 } = e2 || {};
          return t3 in Hn;
        }(n2);
    }
    s2 && function(e2 = {}) {
      const t3 = G($);
      ee().then(() => {
        const n3 = Xn();
        if (n3 && hs({ redirect: n3 }))
          return t3.length > 0 ? Q($, Object.assign({ uniIdRedirectUrl: n3 }, e2)) : void (ns && ls({ api: "navigateTo", redirect: n3 }));
      });
    }(n2);
  });
}
function gs(e) {
  !function(e2) {
    e2.onResponse = function(e3) {
      V(B, e3);
    }, e2.offResponse = function(e3) {
      Y(B, e3);
    };
  }(e), function(e2) {
    e2.onNeedLogin = function(e3) {
      V($, e3);
    }, e2.offNeedLogin = function(e3) {
      Y($, e3);
    }, ts && (U("_globalUniCloudStatus").needLoginInit || (U("_globalUniCloudStatus").needLoginInit = true, ee().then(() => {
      ps.call(e2);
    }), rs && fs.call(e2)));
  }(e), function(e2) {
    e2.onRefreshToken = function(e3) {
      V(W, e3);
    }, e2.offRefreshToken = function(e3) {
      Y(W, e3);
    };
  }(e);
}
let ms;
const ys = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", _s = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;
function ws() {
  const e = ie().token || "", t2 = e.split(".");
  if (!e || 3 !== t2.length)
    return { uid: null, role: [], permission: [], tokenExpired: 0 };
  let n2;
  try {
    n2 = JSON.parse((s2 = t2[1], decodeURIComponent(ms(s2).split("").map(function(e2) {
      return "%" + ("00" + e2.charCodeAt(0).toString(16)).slice(-2);
    }).join(""))));
  } catch (e2) {
    throw new Error("获取当前用户信息出错，详细错误信息为：" + e2.message);
  }
  var s2;
  return n2.tokenExpired = 1e3 * n2.exp, delete n2.exp, delete n2.iat, n2;
}
ms = "function" != typeof atob ? function(e) {
  if (e = String(e).replace(/[\t\n\f\r ]+/g, ""), !_s.test(e))
    throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
  var t2;
  e += "==".slice(2 - (3 & e.length));
  for (var n2, s2, r2 = "", i2 = 0; i2 < e.length; )
    t2 = ys.indexOf(e.charAt(i2++)) << 18 | ys.indexOf(e.charAt(i2++)) << 12 | (n2 = ys.indexOf(e.charAt(i2++))) << 6 | (s2 = ys.indexOf(e.charAt(i2++))), r2 += 64 === n2 ? String.fromCharCode(t2 >> 16 & 255) : 64 === s2 ? String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255) : String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255, 255 & t2);
  return r2;
} : atob;
var vs = s(function(e, t2) {
  Object.defineProperty(t2, "__esModule", { value: true });
  const n2 = "chooseAndUploadFile:ok", s2 = "chooseAndUploadFile:fail";
  function r2(e2, t3) {
    return e2.tempFiles.forEach((e3, n3) => {
      e3.name || (e3.name = e3.path.substring(e3.path.lastIndexOf("/") + 1)), t3 && (e3.fileType = t3), e3.cloudPath = Date.now() + "_" + n3 + e3.name.substring(e3.name.lastIndexOf("."));
    }), e2.tempFilePaths || (e2.tempFilePaths = e2.tempFiles.map((e3) => e3.path)), e2;
  }
  function i2(e2, t3, { onChooseFile: s3, onUploadProgress: r3 }) {
    return t3.then((e3) => {
      if (s3) {
        const t4 = s3(e3);
        if (void 0 !== t4)
          return Promise.resolve(t4).then((t5) => void 0 === t5 ? e3 : t5);
      }
      return e3;
    }).then((t4) => false === t4 ? { errMsg: n2, tempFilePaths: [], tempFiles: [] } : function(e3, t5, s4 = 5, r4) {
      (t5 = Object.assign({}, t5)).errMsg = n2;
      const i3 = t5.tempFiles, o2 = i3.length;
      let a2 = 0;
      return new Promise((n3) => {
        for (; a2 < s4; )
          c2();
        function c2() {
          const s5 = a2++;
          if (s5 >= o2)
            return void (!i3.find((e4) => !e4.url && !e4.errMsg) && n3(t5));
          const u2 = i3[s5];
          e3.uploadFile({ filePath: u2.path, cloudPath: u2.cloudPath, fileType: u2.fileType, onUploadProgress(e4) {
            e4.index = s5, e4.tempFile = u2, e4.tempFilePath = u2.path, r4 && r4(e4);
          } }).then((e4) => {
            u2.url = e4.fileID, s5 < o2 && c2();
          }).catch((e4) => {
            u2.errMsg = e4.errMsg || e4.message, s5 < o2 && c2();
          });
        }
      });
    }(e2, t4, 5, r3));
  }
  t2.initChooseAndUploadFile = function(e2) {
    return function(t3 = { type: "all" }) {
      return "image" === t3.type ? i2(e2, function(e3) {
        const { count: t4, sizeType: n3, sourceType: i3 = ["album", "camera"], extension: o2 } = e3;
        return new Promise((e4, a2) => {
          uni.chooseImage({ count: t4, sizeType: n3, sourceType: i3, extension: o2, success(t5) {
            e4(r2(t5, "image"));
          }, fail(e5) {
            a2({ errMsg: e5.errMsg.replace("chooseImage:fail", s2) });
          } });
        });
      }(t3), t3) : "video" === t3.type ? i2(e2, function(e3) {
        const { camera: t4, compressed: n3, maxDuration: i3, sourceType: o2 = ["album", "camera"], extension: a2 } = e3;
        return new Promise((e4, c2) => {
          uni.chooseVideo({ camera: t4, compressed: n3, maxDuration: i3, sourceType: o2, extension: a2, success(t5) {
            const { tempFilePath: n4, duration: s3, size: i4, height: o3, width: a3 } = t5;
            e4(r2({ errMsg: "chooseVideo:ok", tempFilePaths: [n4], tempFiles: [{ name: t5.tempFile && t5.tempFile.name || "", path: n4, size: i4, type: t5.tempFile && t5.tempFile.type || "", width: a3, height: o3, duration: s3, fileType: "video", cloudPath: "" }] }, "video"));
          }, fail(e5) {
            c2({ errMsg: e5.errMsg.replace("chooseVideo:fail", s2) });
          } });
        });
      }(t3), t3) : i2(e2, function(e3) {
        const { count: t4, extension: n3 } = e3;
        return new Promise((e4, i3) => {
          let o2 = uni.chooseFile;
          if ("undefined" != typeof wx && "function" == typeof wx.chooseMessageFile && (o2 = wx.chooseMessageFile), "function" != typeof o2)
            return i3({ errMsg: s2 + " 请指定 type 类型，该平台仅支持选择 image 或 video。" });
          o2({ type: "all", count: t4, extension: n3, success(t5) {
            e4(r2(t5));
          }, fail(e5) {
            i3({ errMsg: e5.errMsg.replace("chooseFile:fail", s2) });
          } });
        });
      }(t3), t3);
    };
  };
}), Is = n(vs);
const Ss = "manual";
function bs(e) {
  return { props: { localdata: { type: Array, default: () => [] }, options: { type: [Object, Array], default: () => ({}) }, spaceInfo: { type: Object, default: () => ({}) }, collection: { type: [String, Array], default: "" }, action: { type: String, default: "" }, field: { type: String, default: "" }, orderby: { type: String, default: "" }, where: { type: [String, Object], default: "" }, pageData: { type: String, default: "add" }, pageCurrent: { type: Number, default: 1 }, pageSize: { type: Number, default: 20 }, getcount: { type: [Boolean, String], default: false }, gettree: { type: [Boolean, String], default: false }, gettreepath: { type: [Boolean, String], default: false }, startwith: { type: String, default: "" }, limitlevel: { type: Number, default: 10 }, groupby: { type: String, default: "" }, groupField: { type: String, default: "" }, distinct: { type: [Boolean, String], default: false }, foreignKey: { type: String, default: "" }, loadtime: { type: String, default: "auto" }, manual: { type: Boolean, default: false } }, data: () => ({ mixinDatacomLoading: false, mixinDatacomHasMore: false, mixinDatacomResData: [], mixinDatacomErrorMessage: "", mixinDatacomPage: {} }), created() {
    this.mixinDatacomPage = { current: this.pageCurrent, size: this.pageSize, count: 0 }, this.$watch(() => {
      var e2 = [];
      return ["pageCurrent", "pageSize", "localdata", "collection", "action", "field", "orderby", "where", "getont", "getcount", "gettree", "groupby", "groupField", "distinct"].forEach((t2) => {
        e2.push(this[t2]);
      }), e2;
    }, (e2, t2) => {
      if (this.loadtime === Ss)
        return;
      let n2 = false;
      const s2 = [];
      for (let r2 = 2; r2 < e2.length; r2++)
        e2[r2] !== t2[r2] && (s2.push(e2[r2]), n2 = true);
      e2[0] !== t2[0] && (this.mixinDatacomPage.current = this.pageCurrent), this.mixinDatacomPage.size = this.pageSize, this.onMixinDatacomPropsChange(n2, s2);
    });
  }, methods: { onMixinDatacomPropsChange(e2, t2) {
  }, mixinDatacomEasyGet({ getone: e2 = false, success: t2, fail: n2 } = {}) {
    this.mixinDatacomLoading || (this.mixinDatacomLoading = true, this.mixinDatacomErrorMessage = "", this.mixinDatacomGet().then((n3) => {
      this.mixinDatacomLoading = false;
      const { data: s2, count: r2 } = n3.result;
      this.getcount && (this.mixinDatacomPage.count = r2), this.mixinDatacomHasMore = s2.length < this.pageSize;
      const i2 = e2 ? s2.length ? s2[0] : void 0 : s2;
      this.mixinDatacomResData = i2, t2 && t2(i2);
    }).catch((e3) => {
      this.mixinDatacomLoading = false, this.mixinDatacomErrorMessage = e3, n2 && n2(e3);
    }));
  }, mixinDatacomGet(t2 = {}) {
    let n2 = e.database(this.spaceInfo);
    const s2 = t2.action || this.action;
    s2 && (n2 = n2.action(s2));
    const r2 = t2.collection || this.collection;
    n2 = Array.isArray(r2) ? n2.collection(...r2) : n2.collection(r2);
    const i2 = t2.where || this.where;
    i2 && Object.keys(i2).length && (n2 = n2.where(i2));
    const o2 = t2.field || this.field;
    o2 && (n2 = n2.field(o2));
    const a2 = t2.foreignKey || this.foreignKey;
    a2 && (n2 = n2.foreignKey(a2));
    const c2 = t2.groupby || this.groupby;
    c2 && (n2 = n2.groupBy(c2));
    const u2 = t2.groupField || this.groupField;
    u2 && (n2 = n2.groupField(u2));
    true === (void 0 !== t2.distinct ? t2.distinct : this.distinct) && (n2 = n2.distinct());
    const h2 = t2.orderby || this.orderby;
    h2 && (n2 = n2.orderBy(h2));
    const l2 = void 0 !== t2.pageCurrent ? t2.pageCurrent : this.mixinDatacomPage.current, d2 = void 0 !== t2.pageSize ? t2.pageSize : this.mixinDatacomPage.size, p2 = void 0 !== t2.getcount ? t2.getcount : this.getcount, f2 = void 0 !== t2.gettree ? t2.gettree : this.gettree, g2 = void 0 !== t2.gettreepath ? t2.gettreepath : this.gettreepath, m2 = { getCount: p2 }, y2 = { limitLevel: void 0 !== t2.limitlevel ? t2.limitlevel : this.limitlevel, startWith: void 0 !== t2.startwith ? t2.startwith : this.startwith };
    return f2 && (m2.getTree = y2), g2 && (m2.getTreePath = y2), n2 = n2.skip(d2 * (l2 - 1)).limit(d2).get(m2), n2;
  } } };
}
function ks(e) {
  return function(t2, n2 = {}) {
    n2 = function(e2, t3 = {}) {
      return e2.customUI = t3.customUI || e2.customUI, e2.parseSystemError = t3.parseSystemError || e2.parseSystemError, Object.assign(e2.loadingOptions, t3.loadingOptions), Object.assign(e2.errorOptions, t3.errorOptions), "object" == typeof t3.secretMethods && (e2.secretMethods = t3.secretMethods), e2;
    }({ customUI: false, loadingOptions: { title: "加载中...", mask: true }, errorOptions: { type: "modal", retry: false } }, n2);
    const { customUI: s2, loadingOptions: r2, errorOptions: i2, parseSystemError: o2 } = n2, a2 = !s2;
    return new Proxy({}, { get: (s3, c2) => function({ fn: e2, interceptorName: t3, getCallbackArgs: n3 } = {}) {
      return async function(...s4) {
        const r3 = n3 ? n3({ params: s4 }) : {};
        let i3, o3;
        try {
          return await M(q(t3, "invoke"), { ...r3 }), i3 = await e2(...s4), await M(q(t3, "success"), { ...r3, result: i3 }), i3;
        } catch (e3) {
          throw o3 = e3, await M(q(t3, "fail"), { ...r3, error: o3 }), o3;
        } finally {
          await M(q(t3, "complete"), o3 ? { ...r3, error: o3 } : { ...r3, result: i3 });
        }
      };
    }({ fn: async function s4(...u2) {
      let l2;
      a2 && uni.showLoading({ title: r2.title, mask: r2.mask });
      const d2 = { name: t2, type: h, data: { method: c2, params: u2 } };
      "object" == typeof n2.secretMethods && function(e2, t3) {
        const n3 = t3.data.method, s5 = e2.secretMethods || {}, r3 = s5[n3] || s5["*"];
        r3 && (t3.secretType = r3);
      }(n2, d2);
      let p2 = false;
      try {
        l2 = await e.callFunction(d2);
      } catch (e2) {
        p2 = true, l2 = { result: new ne(e2) };
      }
      const { errSubject: f2, errCode: g2, errMsg: m2, newToken: y2 } = l2.result || {};
      if (a2 && uni.hideLoading(), y2 && y2.token && y2.tokenExpired && (oe(y2), Q(W, { ...y2 })), g2) {
        let e2 = m2;
        if (p2 && o2) {
          e2 = (await o2({ objectName: t2, methodName: c2, params: u2, errSubject: f2, errCode: g2, errMsg: m2 })).errMsg || m2;
        }
        if (a2)
          if ("toast" === i2.type)
            uni.showToast({ title: e2, icon: "none" });
          else {
            if ("modal" !== i2.type)
              throw new Error(`Invalid errorOptions.type: ${i2.type}`);
            {
              const { confirm: t3 } = await async function({ title: e3, content: t4, showCancel: n4, cancelText: s5, confirmText: r3 } = {}) {
                return new Promise((i3, o3) => {
                  uni.showModal({ title: e3, content: t4, showCancel: n4, cancelText: s5, confirmText: r3, success(e4) {
                    i3(e4);
                  }, fail() {
                    i3({ confirm: false, cancel: true });
                  } });
                });
              }({ title: "提示", content: e2, showCancel: i2.retry, cancelText: "取消", confirmText: i2.retry ? "重试" : "确定" });
              if (i2.retry && t3)
                return s4(...u2);
            }
          }
        const n3 = new ne({ subject: f2, code: g2, message: m2, requestId: l2.requestId });
        throw n3.detail = l2.result, Q(B, { type: H, content: n3 }), n3;
      }
      return Q(B, { type: H, content: l2.result }), l2.result;
    }, interceptorName: "callObject", getCallbackArgs: function({ params: e2 } = {}) {
      return { objectName: t2, methodName: c2, params: e2 };
    } }) });
  };
}
function Cs(e) {
  return U("_globalUniCloudSecureNetworkCache__{spaceId}".replace("{spaceId}", e.config.spaceId));
}
async function Ts({ openid: e, callLoginByWeixin: t2 = false } = {}) {
  Cs(this);
  throw new Error(`[SecureNetwork] API \`initSecureNetworkByWeixin\` is not supported on platform \`${P}\``);
}
async function Ps(e) {
  const t2 = Cs(this);
  return t2.initPromise || (t2.initPromise = Ts.call(this, e)), t2.initPromise;
}
function As(e) {
  return function({ openid: t2, callLoginByWeixin: n2 = false } = {}) {
    return Ps.call(e, { openid: t2, callLoginByWeixin: n2 });
  };
}
function Es(e) {
  const t2 = { getSystemInfo: uni.getSystemInfo, getPushClientId: uni.getPushClientId };
  return function(n2) {
    return new Promise((s2, r2) => {
      t2[e]({ ...n2, success(e2) {
        s2(e2);
      }, fail(e2) {
        r2(e2);
      } });
    });
  };
}
class Os extends class {
  constructor() {
    this._callback = {};
  }
  addListener(e, t2) {
    this._callback[e] || (this._callback[e] = []), this._callback[e].push(t2);
  }
  on(e, t2) {
    return this.addListener(e, t2);
  }
  removeListener(e, t2) {
    if (!t2)
      throw new Error('The "listener" argument must be of type function. Received undefined');
    const n2 = this._callback[e];
    if (!n2)
      return;
    const s2 = function(e2, t3) {
      for (let n3 = e2.length - 1; n3 >= 0; n3--)
        if (e2[n3] === t3)
          return n3;
      return -1;
    }(n2, t2);
    n2.splice(s2, 1);
  }
  off(e, t2) {
    return this.removeListener(e, t2);
  }
  removeAllListener(e) {
    delete this._callback[e];
  }
  emit(e, ...t2) {
    const n2 = this._callback[e];
    if (n2)
      for (let e2 = 0; e2 < n2.length; e2++)
        n2[e2](...t2);
  }
} {
  constructor() {
    super(), this._uniPushMessageCallback = this._receivePushMessage.bind(this), this._currentMessageId = -1, this._payloadQueue = [];
  }
  init() {
    return Promise.all([Es("getSystemInfo")(), Es("getPushClientId")()]).then(([{ appId: e } = {}, { cid: t2 } = {}] = []) => {
      if (!e)
        throw new Error("Invalid appId, please check the manifest.json file");
      if (!t2)
        throw new Error("Invalid push client id");
      this._appId = e, this._pushClientId = t2, this._seqId = Date.now() + "-" + Math.floor(9e5 * Math.random() + 1e5), this.emit("open"), this._initMessageListener();
    }, (e) => {
      throw this.emit("error", e), this.close(), e;
    });
  }
  async open() {
    return this.init();
  }
  _isUniCloudSSE(e) {
    if ("receive" !== e.type)
      return false;
    const t2 = e && e.data && e.data.payload;
    return !(!t2 || "UNI_CLOUD_SSE" !== t2.channel || t2.seqId !== this._seqId);
  }
  _receivePushMessage(e) {
    if (!this._isUniCloudSSE(e))
      return;
    const t2 = e && e.data && e.data.payload, { action: n2, messageId: s2, message: r2 } = t2;
    this._payloadQueue.push({ action: n2, messageId: s2, message: r2 }), this._consumMessage();
  }
  _consumMessage() {
    for (; ; ) {
      const e = this._payloadQueue.find((e2) => e2.messageId === this._currentMessageId + 1);
      if (!e)
        break;
      this._currentMessageId++, this._parseMessagePayload(e);
    }
  }
  _parseMessagePayload(e) {
    const { action: t2, messageId: n2, message: s2 } = e;
    "end" === t2 ? this._end({ messageId: n2, message: s2 }) : "message" === t2 && this._appendMessage({ messageId: n2, message: s2 });
  }
  _appendMessage({ messageId: e, message: t2 } = {}) {
    this.emit("message", t2);
  }
  _end({ messageId: e, message: t2 } = {}) {
    this.emit("end", t2), this.close();
  }
  _initMessageListener() {
    uni.onPushMessage(this._uniPushMessageCallback);
  }
  _destroy() {
    uni.offPushMessage(this._uniPushMessageCallback);
  }
  toJSON() {
    return { appId: this._appId, pushClientId: this._pushClientId, seqId: this._seqId };
  }
  close() {
    this._destroy(), this.emit("close");
  }
}
async function xs(e, t2) {
  const n2 = `http://${e}:${t2}/system/ping`;
  try {
    const e2 = await (s2 = { url: n2, timeout: 500 }, new Promise((e3, t3) => {
      se.request({ ...s2, success(t4) {
        e3(t4);
      }, fail(e4) {
        t3(e4);
      } });
    }));
    return !(!e2.data || 0 !== e2.data.code);
  } catch (e2) {
    return false;
  }
  var s2;
}
async function Rs(e) {
  {
    const { osName: e2, osVersion: t3 } = ue();
    "ios" === e2 && function(e3) {
      if (!e3 || "string" != typeof e3)
        return 0;
      const t4 = e3.match(/^(\d+)./);
      return t4 && t4[1] ? parseInt(t4[1]) : 0;
    }(t3) >= 14 && console.warn("iOS 14及以上版本连接uniCloud本地调试服务需要允许客户端查找并连接到本地网络上的设备（仅开发模式生效，发行模式会连接uniCloud云端服务）");
  }
  const t2 = e.__dev__;
  if (!t2.debugInfo)
    return;
  const { address: n2, servePort: s2 } = t2.debugInfo, { address: r2 } = await async function(e2, t3) {
    let n3;
    for (let s3 = 0; s3 < e2.length; s3++) {
      const r3 = e2[s3];
      if (await xs(r3, t3)) {
        n3 = r3;
        break;
      }
    }
    return { address: n3, port: t3 };
  }(n2, s2);
  if (r2)
    return t2.localAddress = r2, void (t2.localPort = s2);
  const i2 = console["error"];
  let o2 = "";
  if ("remote" === t2.debugInfo.initialLaunchType ? (t2.debugInfo.forceRemote = true, o2 = "当前客户端和HBuilderX不在同一局域网下（或其他网络原因无法连接HBuilderX），uniCloud本地调试服务不对当前客户端生效。\n- 如果不使用uniCloud本地调试服务，请直接忽略此信息。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。") : o2 = "无法连接uniCloud本地调试服务，请检查当前客户端是否与主机在同一局域网下。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。", o2 += "\n- 如果在HBuilderX开启的状态下切换过网络环境，请重启HBuilderX后再试\n- 检查系统防火墙是否拦截了HBuilderX自带的nodejs\n- 检查是否错误的使用拦截器修改uni.request方法的参数", 0 === P.indexOf("mp-") && (o2 += "\n- 小程序中如何使用uniCloud，请参考：https://uniapp.dcloud.net.cn/uniCloud/publish.html#useinmp"), !t2.debugInfo.forceRemote)
    throw new Error(o2);
  i2(o2);
}
function Us(e) {
  e._initPromiseHub || (e._initPromiseHub = new I({ createPromise: function() {
    let t2 = Promise.resolve();
    var n2;
    n2 = 1, t2 = new Promise((e2) => {
      setTimeout(() => {
        e2();
      }, n2);
    });
    const s2 = e.auth();
    return t2.then(() => s2.getLoginState()).then((e2) => e2 ? Promise.resolve() : s2.signInAnonymously());
  } }));
}
const Ls = { tcb: St, tencent: St, aliyun: me, private: kt };
let Ns = new class {
  init(e) {
    let t2 = {};
    const n2 = Ls[e.provider];
    if (!n2)
      throw new Error("未提供正确的provider参数");
    t2 = n2.init(e), function(e2) {
      const t3 = {};
      e2.__dev__ = t3, t3.debugLog = "app" === P;
      const n3 = A;
      n3 && !n3.code && (t3.debugInfo = n3);
      const s2 = new I({ createPromise: function() {
        return Rs(e2);
      } });
      t3.initLocalNetwork = function() {
        return s2.exec();
      };
    }(t2), Us(t2), Rn(t2), function(e2) {
      const t3 = e2.uploadFile;
      e2.uploadFile = function(e3) {
        return t3.call(this, e3);
      };
    }(t2), function(e2) {
      e2.database = function(t3) {
        if (t3 && Object.keys(t3).length > 0)
          return e2.init(t3).database();
        if (this._database)
          return this._database;
        const n3 = $n(Wn, { uniClient: e2 });
        return this._database = n3, n3;
      }, e2.databaseForJQL = function(t3) {
        if (t3 && Object.keys(t3).length > 0)
          return e2.init(t3).databaseForJQL();
        if (this._databaseForJQL)
          return this._databaseForJQL;
        const n3 = $n(Wn, { uniClient: e2, isJQL: true });
        return this._databaseForJQL = n3, n3;
      };
    }(t2), function(e2) {
      e2.getCurrentUserInfo = ws, e2.chooseAndUploadFile = Is.initChooseAndUploadFile(e2), Object.assign(e2, { get mixinDatacom() {
        return bs(e2);
      } }), e2.SSEChannel = Os, e2.initSecureNetworkByWeixin = As(e2), e2.importObject = ks(e2);
    }(t2);
    return ["callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "chooseAndUploadFile"].forEach((e2) => {
      if (!t2[e2])
        return;
      const n3 = t2[e2];
      t2[e2] = function() {
        return n3.apply(t2, Array.from(arguments));
      }, t2[e2] = function(e3, t3) {
        return function(n4) {
          let s2 = false;
          if ("callFunction" === t3) {
            const e4 = n4 && n4.type || u;
            s2 = e4 !== u;
          }
          const r2 = "callFunction" === t3 && !s2, i2 = this._initPromiseHub.exec();
          n4 = n4 || {};
          const { success: o2, fail: a2, complete: c2 } = te(n4), h2 = i2.then(() => s2 ? Promise.resolve() : M(q(t3, "invoke"), n4)).then(() => e3.call(this, n4)).then((e4) => s2 ? Promise.resolve(e4) : M(q(t3, "success"), e4).then(() => M(q(t3, "complete"), e4)).then(() => (r2 && Q(B, { type: J, content: e4 }), Promise.resolve(e4))), (e4) => s2 ? Promise.reject(e4) : M(q(t3, "fail"), e4).then(() => M(q(t3, "complete"), e4)).then(() => (Q(B, { type: J, content: e4 }), Promise.reject(e4))));
          if (!(o2 || a2 || c2))
            return h2;
          h2.then((e4) => {
            o2 && o2(e4), c2 && c2(e4), r2 && Q(B, { type: J, content: e4 });
          }, (e4) => {
            a2 && a2(e4), c2 && c2(e4), r2 && Q(B, { type: J, content: e4 });
          });
        };
      }(t2[e2], e2).bind(t2);
    }), t2.init = this.init, t2;
  }
}();
(() => {
  const e = E;
  let t2 = {};
  if (e && 1 === e.length)
    t2 = e[0], Ns = Ns.init(t2), Ns._isDefault = true;
  else {
    const t3 = ["auth", "callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "database", "getCurrentUSerInfo", "importObject"];
    let n2;
    n2 = e && e.length > 0 ? "应用有多个服务空间，请通过uniCloud.init方法指定要使用的服务空间" : "应用未关联服务空间，请在uniCloud目录右键关联服务空间", t3.forEach((e2) => {
      Ns[e2] = function() {
        return console.error(n2), Promise.reject(new ne({ code: "SYS_ERR", message: n2 }));
      };
    });
  }
  Object.assign(Ns, { get mixinDatacom() {
    return bs(Ns);
  } }), gs(Ns), Ns.addInterceptor = D, Ns.removeInterceptor = F, Ns.interceptObject = K;
})();
var Ds = Ns;
const icons = {
  "id": "2852637",
  "name": "uniui图标库",
  "font_family": "uniicons",
  "css_prefix_text": "uniui-",
  "description": "",
  "glyphs": [
    {
      "icon_id": "25027049",
      "name": "yanse",
      "font_class": "color",
      "unicode": "e6cf",
      "unicode_decimal": 59087
    },
    {
      "icon_id": "25027048",
      "name": "wallet",
      "font_class": "wallet",
      "unicode": "e6b1",
      "unicode_decimal": 59057
    },
    {
      "icon_id": "25015720",
      "name": "settings-filled",
      "font_class": "settings-filled",
      "unicode": "e6ce",
      "unicode_decimal": 59086
    },
    {
      "icon_id": "25015434",
      "name": "shimingrenzheng-filled",
      "font_class": "auth-filled",
      "unicode": "e6cc",
      "unicode_decimal": 59084
    },
    {
      "icon_id": "24934246",
      "name": "shop-filled",
      "font_class": "shop-filled",
      "unicode": "e6cd",
      "unicode_decimal": 59085
    },
    {
      "icon_id": "24934159",
      "name": "staff-filled-01",
      "font_class": "staff-filled",
      "unicode": "e6cb",
      "unicode_decimal": 59083
    },
    {
      "icon_id": "24932461",
      "name": "VIP-filled",
      "font_class": "vip-filled",
      "unicode": "e6c6",
      "unicode_decimal": 59078
    },
    {
      "icon_id": "24932462",
      "name": "plus_circle_fill",
      "font_class": "plus-filled",
      "unicode": "e6c7",
      "unicode_decimal": 59079
    },
    {
      "icon_id": "24932463",
      "name": "folder_add-filled",
      "font_class": "folder-add-filled",
      "unicode": "e6c8",
      "unicode_decimal": 59080
    },
    {
      "icon_id": "24932464",
      "name": "yanse-filled",
      "font_class": "color-filled",
      "unicode": "e6c9",
      "unicode_decimal": 59081
    },
    {
      "icon_id": "24932465",
      "name": "tune-filled",
      "font_class": "tune-filled",
      "unicode": "e6ca",
      "unicode_decimal": 59082
    },
    {
      "icon_id": "24932455",
      "name": "a-rilidaka-filled",
      "font_class": "calendar-filled",
      "unicode": "e6c0",
      "unicode_decimal": 59072
    },
    {
      "icon_id": "24932456",
      "name": "notification-filled",
      "font_class": "notification-filled",
      "unicode": "e6c1",
      "unicode_decimal": 59073
    },
    {
      "icon_id": "24932457",
      "name": "wallet-filled",
      "font_class": "wallet-filled",
      "unicode": "e6c2",
      "unicode_decimal": 59074
    },
    {
      "icon_id": "24932458",
      "name": "paihangbang-filled",
      "font_class": "medal-filled",
      "unicode": "e6c3",
      "unicode_decimal": 59075
    },
    {
      "icon_id": "24932459",
      "name": "gift-filled",
      "font_class": "gift-filled",
      "unicode": "e6c4",
      "unicode_decimal": 59076
    },
    {
      "icon_id": "24932460",
      "name": "fire-filled",
      "font_class": "fire-filled",
      "unicode": "e6c5",
      "unicode_decimal": 59077
    },
    {
      "icon_id": "24928001",
      "name": "refreshempty",
      "font_class": "refreshempty",
      "unicode": "e6bf",
      "unicode_decimal": 59071
    },
    {
      "icon_id": "24926853",
      "name": "location-ellipse",
      "font_class": "location-filled",
      "unicode": "e6af",
      "unicode_decimal": 59055
    },
    {
      "icon_id": "24926735",
      "name": "person-filled",
      "font_class": "person-filled",
      "unicode": "e69d",
      "unicode_decimal": 59037
    },
    {
      "icon_id": "24926703",
      "name": "personadd-filled",
      "font_class": "personadd-filled",
      "unicode": "e698",
      "unicode_decimal": 59032
    },
    {
      "icon_id": "24923351",
      "name": "back",
      "font_class": "back",
      "unicode": "e6b9",
      "unicode_decimal": 59065
    },
    {
      "icon_id": "24923352",
      "name": "forward",
      "font_class": "forward",
      "unicode": "e6ba",
      "unicode_decimal": 59066
    },
    {
      "icon_id": "24923353",
      "name": "arrowthinright",
      "font_class": "arrow-right",
      "unicode": "e6bb",
      "unicode_decimal": 59067
    },
    {
      "icon_id": "24923353",
      "name": "arrowthinright",
      "font_class": "arrowthinright",
      "unicode": "e6bb",
      "unicode_decimal": 59067
    },
    {
      "icon_id": "24923354",
      "name": "arrowthinleft",
      "font_class": "arrow-left",
      "unicode": "e6bc",
      "unicode_decimal": 59068
    },
    {
      "icon_id": "24923354",
      "name": "arrowthinleft",
      "font_class": "arrowthinleft",
      "unicode": "e6bc",
      "unicode_decimal": 59068
    },
    {
      "icon_id": "24923355",
      "name": "arrowthinup",
      "font_class": "arrow-up",
      "unicode": "e6bd",
      "unicode_decimal": 59069
    },
    {
      "icon_id": "24923355",
      "name": "arrowthinup",
      "font_class": "arrowthinup",
      "unicode": "e6bd",
      "unicode_decimal": 59069
    },
    {
      "icon_id": "24923356",
      "name": "arrowthindown",
      "font_class": "arrow-down",
      "unicode": "e6be",
      "unicode_decimal": 59070
    },
    {
      "icon_id": "24923356",
      "name": "arrowthindown",
      "font_class": "arrowthindown",
      "unicode": "e6be",
      "unicode_decimal": 59070
    },
    {
      "icon_id": "24923349",
      "name": "arrowdown",
      "font_class": "bottom",
      "unicode": "e6b8",
      "unicode_decimal": 59064
    },
    {
      "icon_id": "24923349",
      "name": "arrowdown",
      "font_class": "arrowdown",
      "unicode": "e6b8",
      "unicode_decimal": 59064
    },
    {
      "icon_id": "24923346",
      "name": "arrowright",
      "font_class": "right",
      "unicode": "e6b5",
      "unicode_decimal": 59061
    },
    {
      "icon_id": "24923346",
      "name": "arrowright",
      "font_class": "arrowright",
      "unicode": "e6b5",
      "unicode_decimal": 59061
    },
    {
      "icon_id": "24923347",
      "name": "arrowup",
      "font_class": "top",
      "unicode": "e6b6",
      "unicode_decimal": 59062
    },
    {
      "icon_id": "24923347",
      "name": "arrowup",
      "font_class": "arrowup",
      "unicode": "e6b6",
      "unicode_decimal": 59062
    },
    {
      "icon_id": "24923348",
      "name": "arrowleft",
      "font_class": "left",
      "unicode": "e6b7",
      "unicode_decimal": 59063
    },
    {
      "icon_id": "24923348",
      "name": "arrowleft",
      "font_class": "arrowleft",
      "unicode": "e6b7",
      "unicode_decimal": 59063
    },
    {
      "icon_id": "24923334",
      "name": "eye",
      "font_class": "eye",
      "unicode": "e651",
      "unicode_decimal": 58961
    },
    {
      "icon_id": "24923335",
      "name": "eye-filled",
      "font_class": "eye-filled",
      "unicode": "e66a",
      "unicode_decimal": 58986
    },
    {
      "icon_id": "24923336",
      "name": "eye-slash",
      "font_class": "eye-slash",
      "unicode": "e6b3",
      "unicode_decimal": 59059
    },
    {
      "icon_id": "24923337",
      "name": "eye-slash-filled",
      "font_class": "eye-slash-filled",
      "unicode": "e6b4",
      "unicode_decimal": 59060
    },
    {
      "icon_id": "24923305",
      "name": "info-filled",
      "font_class": "info-filled",
      "unicode": "e649",
      "unicode_decimal": 58953
    },
    {
      "icon_id": "24923299",
      "name": "reload-01",
      "font_class": "reload",
      "unicode": "e6b2",
      "unicode_decimal": 59058
    },
    {
      "icon_id": "24923195",
      "name": "mic_slash_fill",
      "font_class": "micoff-filled",
      "unicode": "e6b0",
      "unicode_decimal": 59056
    },
    {
      "icon_id": "24923165",
      "name": "map-pin-ellipse",
      "font_class": "map-pin-ellipse",
      "unicode": "e6ac",
      "unicode_decimal": 59052
    },
    {
      "icon_id": "24923166",
      "name": "map-pin",
      "font_class": "map-pin",
      "unicode": "e6ad",
      "unicode_decimal": 59053
    },
    {
      "icon_id": "24923167",
      "name": "location",
      "font_class": "location",
      "unicode": "e6ae",
      "unicode_decimal": 59054
    },
    {
      "icon_id": "24923064",
      "name": "starhalf",
      "font_class": "starhalf",
      "unicode": "e683",
      "unicode_decimal": 59011
    },
    {
      "icon_id": "24923065",
      "name": "star",
      "font_class": "star",
      "unicode": "e688",
      "unicode_decimal": 59016
    },
    {
      "icon_id": "24923066",
      "name": "star-filled",
      "font_class": "star-filled",
      "unicode": "e68f",
      "unicode_decimal": 59023
    },
    {
      "icon_id": "24899646",
      "name": "a-rilidaka",
      "font_class": "calendar",
      "unicode": "e6a0",
      "unicode_decimal": 59040
    },
    {
      "icon_id": "24899647",
      "name": "fire",
      "font_class": "fire",
      "unicode": "e6a1",
      "unicode_decimal": 59041
    },
    {
      "icon_id": "24899648",
      "name": "paihangbang",
      "font_class": "medal",
      "unicode": "e6a2",
      "unicode_decimal": 59042
    },
    {
      "icon_id": "24899649",
      "name": "font",
      "font_class": "font",
      "unicode": "e6a3",
      "unicode_decimal": 59043
    },
    {
      "icon_id": "24899650",
      "name": "gift",
      "font_class": "gift",
      "unicode": "e6a4",
      "unicode_decimal": 59044
    },
    {
      "icon_id": "24899651",
      "name": "link",
      "font_class": "link",
      "unicode": "e6a5",
      "unicode_decimal": 59045
    },
    {
      "icon_id": "24899652",
      "name": "notification",
      "font_class": "notification",
      "unicode": "e6a6",
      "unicode_decimal": 59046
    },
    {
      "icon_id": "24899653",
      "name": "staff",
      "font_class": "staff",
      "unicode": "e6a7",
      "unicode_decimal": 59047
    },
    {
      "icon_id": "24899654",
      "name": "VIP",
      "font_class": "vip",
      "unicode": "e6a8",
      "unicode_decimal": 59048
    },
    {
      "icon_id": "24899655",
      "name": "folder_add",
      "font_class": "folder-add",
      "unicode": "e6a9",
      "unicode_decimal": 59049
    },
    {
      "icon_id": "24899656",
      "name": "tune",
      "font_class": "tune",
      "unicode": "e6aa",
      "unicode_decimal": 59050
    },
    {
      "icon_id": "24899657",
      "name": "shimingrenzheng",
      "font_class": "auth",
      "unicode": "e6ab",
      "unicode_decimal": 59051
    },
    {
      "icon_id": "24899565",
      "name": "person",
      "font_class": "person",
      "unicode": "e699",
      "unicode_decimal": 59033
    },
    {
      "icon_id": "24899566",
      "name": "email-filled",
      "font_class": "email-filled",
      "unicode": "e69a",
      "unicode_decimal": 59034
    },
    {
      "icon_id": "24899567",
      "name": "phone-filled",
      "font_class": "phone-filled",
      "unicode": "e69b",
      "unicode_decimal": 59035
    },
    {
      "icon_id": "24899568",
      "name": "phone",
      "font_class": "phone",
      "unicode": "e69c",
      "unicode_decimal": 59036
    },
    {
      "icon_id": "24899570",
      "name": "email",
      "font_class": "email",
      "unicode": "e69e",
      "unicode_decimal": 59038
    },
    {
      "icon_id": "24899571",
      "name": "personadd",
      "font_class": "personadd",
      "unicode": "e69f",
      "unicode_decimal": 59039
    },
    {
      "icon_id": "24899558",
      "name": "chatboxes-filled",
      "font_class": "chatboxes-filled",
      "unicode": "e692",
      "unicode_decimal": 59026
    },
    {
      "icon_id": "24899559",
      "name": "contact",
      "font_class": "contact",
      "unicode": "e693",
      "unicode_decimal": 59027
    },
    {
      "icon_id": "24899560",
      "name": "chatbubble-filled",
      "font_class": "chatbubble-filled",
      "unicode": "e694",
      "unicode_decimal": 59028
    },
    {
      "icon_id": "24899561",
      "name": "contact-filled",
      "font_class": "contact-filled",
      "unicode": "e695",
      "unicode_decimal": 59029
    },
    {
      "icon_id": "24899562",
      "name": "chatboxes",
      "font_class": "chatboxes",
      "unicode": "e696",
      "unicode_decimal": 59030
    },
    {
      "icon_id": "24899563",
      "name": "chatbubble",
      "font_class": "chatbubble",
      "unicode": "e697",
      "unicode_decimal": 59031
    },
    {
      "icon_id": "24881290",
      "name": "upload-filled",
      "font_class": "upload-filled",
      "unicode": "e68e",
      "unicode_decimal": 59022
    },
    {
      "icon_id": "24881292",
      "name": "upload",
      "font_class": "upload",
      "unicode": "e690",
      "unicode_decimal": 59024
    },
    {
      "icon_id": "24881293",
      "name": "weixin",
      "font_class": "weixin",
      "unicode": "e691",
      "unicode_decimal": 59025
    },
    {
      "icon_id": "24881274",
      "name": "compose",
      "font_class": "compose",
      "unicode": "e67f",
      "unicode_decimal": 59007
    },
    {
      "icon_id": "24881275",
      "name": "qq",
      "font_class": "qq",
      "unicode": "e680",
      "unicode_decimal": 59008
    },
    {
      "icon_id": "24881276",
      "name": "download-filled",
      "font_class": "download-filled",
      "unicode": "e681",
      "unicode_decimal": 59009
    },
    {
      "icon_id": "24881277",
      "name": "pengyouquan",
      "font_class": "pyq",
      "unicode": "e682",
      "unicode_decimal": 59010
    },
    {
      "icon_id": "24881279",
      "name": "sound",
      "font_class": "sound",
      "unicode": "e684",
      "unicode_decimal": 59012
    },
    {
      "icon_id": "24881280",
      "name": "trash-filled",
      "font_class": "trash-filled",
      "unicode": "e685",
      "unicode_decimal": 59013
    },
    {
      "icon_id": "24881281",
      "name": "sound-filled",
      "font_class": "sound-filled",
      "unicode": "e686",
      "unicode_decimal": 59014
    },
    {
      "icon_id": "24881282",
      "name": "trash",
      "font_class": "trash",
      "unicode": "e687",
      "unicode_decimal": 59015
    },
    {
      "icon_id": "24881284",
      "name": "videocam-filled",
      "font_class": "videocam-filled",
      "unicode": "e689",
      "unicode_decimal": 59017
    },
    {
      "icon_id": "24881285",
      "name": "spinner-cycle",
      "font_class": "spinner-cycle",
      "unicode": "e68a",
      "unicode_decimal": 59018
    },
    {
      "icon_id": "24881286",
      "name": "weibo",
      "font_class": "weibo",
      "unicode": "e68b",
      "unicode_decimal": 59019
    },
    {
      "icon_id": "24881288",
      "name": "videocam",
      "font_class": "videocam",
      "unicode": "e68c",
      "unicode_decimal": 59020
    },
    {
      "icon_id": "24881289",
      "name": "download",
      "font_class": "download",
      "unicode": "e68d",
      "unicode_decimal": 59021
    },
    {
      "icon_id": "24879601",
      "name": "help",
      "font_class": "help",
      "unicode": "e679",
      "unicode_decimal": 59001
    },
    {
      "icon_id": "24879602",
      "name": "navigate-filled",
      "font_class": "navigate-filled",
      "unicode": "e67a",
      "unicode_decimal": 59002
    },
    {
      "icon_id": "24879603",
      "name": "plusempty",
      "font_class": "plusempty",
      "unicode": "e67b",
      "unicode_decimal": 59003
    },
    {
      "icon_id": "24879604",
      "name": "smallcircle",
      "font_class": "smallcircle",
      "unicode": "e67c",
      "unicode_decimal": 59004
    },
    {
      "icon_id": "24879605",
      "name": "minus-filled",
      "font_class": "minus-filled",
      "unicode": "e67d",
      "unicode_decimal": 59005
    },
    {
      "icon_id": "24879606",
      "name": "micoff",
      "font_class": "micoff",
      "unicode": "e67e",
      "unicode_decimal": 59006
    },
    {
      "icon_id": "24879588",
      "name": "closeempty",
      "font_class": "closeempty",
      "unicode": "e66c",
      "unicode_decimal": 58988
    },
    {
      "icon_id": "24879589",
      "name": "clear",
      "font_class": "clear",
      "unicode": "e66d",
      "unicode_decimal": 58989
    },
    {
      "icon_id": "24879590",
      "name": "navigate",
      "font_class": "navigate",
      "unicode": "e66e",
      "unicode_decimal": 58990
    },
    {
      "icon_id": "24879591",
      "name": "minus",
      "font_class": "minus",
      "unicode": "e66f",
      "unicode_decimal": 58991
    },
    {
      "icon_id": "24879592",
      "name": "image",
      "font_class": "image",
      "unicode": "e670",
      "unicode_decimal": 58992
    },
    {
      "icon_id": "24879593",
      "name": "mic",
      "font_class": "mic",
      "unicode": "e671",
      "unicode_decimal": 58993
    },
    {
      "icon_id": "24879594",
      "name": "paperplane",
      "font_class": "paperplane",
      "unicode": "e672",
      "unicode_decimal": 58994
    },
    {
      "icon_id": "24879595",
      "name": "close",
      "font_class": "close",
      "unicode": "e673",
      "unicode_decimal": 58995
    },
    {
      "icon_id": "24879596",
      "name": "help-filled",
      "font_class": "help-filled",
      "unicode": "e674",
      "unicode_decimal": 58996
    },
    {
      "icon_id": "24879597",
      "name": "plus-filled",
      "font_class": "paperplane-filled",
      "unicode": "e675",
      "unicode_decimal": 58997
    },
    {
      "icon_id": "24879598",
      "name": "plus",
      "font_class": "plus",
      "unicode": "e676",
      "unicode_decimal": 58998
    },
    {
      "icon_id": "24879599",
      "name": "mic-filled",
      "font_class": "mic-filled",
      "unicode": "e677",
      "unicode_decimal": 58999
    },
    {
      "icon_id": "24879600",
      "name": "image-filled",
      "font_class": "image-filled",
      "unicode": "e678",
      "unicode_decimal": 59e3
    },
    {
      "icon_id": "24855900",
      "name": "locked-filled",
      "font_class": "locked-filled",
      "unicode": "e668",
      "unicode_decimal": 58984
    },
    {
      "icon_id": "24855901",
      "name": "info",
      "font_class": "info",
      "unicode": "e669",
      "unicode_decimal": 58985
    },
    {
      "icon_id": "24855903",
      "name": "locked",
      "font_class": "locked",
      "unicode": "e66b",
      "unicode_decimal": 58987
    },
    {
      "icon_id": "24855884",
      "name": "camera-filled",
      "font_class": "camera-filled",
      "unicode": "e658",
      "unicode_decimal": 58968
    },
    {
      "icon_id": "24855885",
      "name": "chat-filled",
      "font_class": "chat-filled",
      "unicode": "e659",
      "unicode_decimal": 58969
    },
    {
      "icon_id": "24855886",
      "name": "camera",
      "font_class": "camera",
      "unicode": "e65a",
      "unicode_decimal": 58970
    },
    {
      "icon_id": "24855887",
      "name": "circle",
      "font_class": "circle",
      "unicode": "e65b",
      "unicode_decimal": 58971
    },
    {
      "icon_id": "24855888",
      "name": "checkmarkempty",
      "font_class": "checkmarkempty",
      "unicode": "e65c",
      "unicode_decimal": 58972
    },
    {
      "icon_id": "24855889",
      "name": "chat",
      "font_class": "chat",
      "unicode": "e65d",
      "unicode_decimal": 58973
    },
    {
      "icon_id": "24855890",
      "name": "circle-filled",
      "font_class": "circle-filled",
      "unicode": "e65e",
      "unicode_decimal": 58974
    },
    {
      "icon_id": "24855891",
      "name": "flag",
      "font_class": "flag",
      "unicode": "e65f",
      "unicode_decimal": 58975
    },
    {
      "icon_id": "24855892",
      "name": "flag-filled",
      "font_class": "flag-filled",
      "unicode": "e660",
      "unicode_decimal": 58976
    },
    {
      "icon_id": "24855893",
      "name": "gear-filled",
      "font_class": "gear-filled",
      "unicode": "e661",
      "unicode_decimal": 58977
    },
    {
      "icon_id": "24855894",
      "name": "home",
      "font_class": "home",
      "unicode": "e662",
      "unicode_decimal": 58978
    },
    {
      "icon_id": "24855895",
      "name": "home-filled",
      "font_class": "home-filled",
      "unicode": "e663",
      "unicode_decimal": 58979
    },
    {
      "icon_id": "24855896",
      "name": "gear",
      "font_class": "gear",
      "unicode": "e664",
      "unicode_decimal": 58980
    },
    {
      "icon_id": "24855897",
      "name": "smallcircle-filled",
      "font_class": "smallcircle-filled",
      "unicode": "e665",
      "unicode_decimal": 58981
    },
    {
      "icon_id": "24855898",
      "name": "map-filled",
      "font_class": "map-filled",
      "unicode": "e666",
      "unicode_decimal": 58982
    },
    {
      "icon_id": "24855899",
      "name": "map",
      "font_class": "map",
      "unicode": "e667",
      "unicode_decimal": 58983
    },
    {
      "icon_id": "24855825",
      "name": "refresh-filled",
      "font_class": "refresh-filled",
      "unicode": "e656",
      "unicode_decimal": 58966
    },
    {
      "icon_id": "24855826",
      "name": "refresh",
      "font_class": "refresh",
      "unicode": "e657",
      "unicode_decimal": 58967
    },
    {
      "icon_id": "24855808",
      "name": "cloud-upload",
      "font_class": "cloud-upload",
      "unicode": "e645",
      "unicode_decimal": 58949
    },
    {
      "icon_id": "24855809",
      "name": "cloud-download-filled",
      "font_class": "cloud-download-filled",
      "unicode": "e646",
      "unicode_decimal": 58950
    },
    {
      "icon_id": "24855810",
      "name": "cloud-download",
      "font_class": "cloud-download",
      "unicode": "e647",
      "unicode_decimal": 58951
    },
    {
      "icon_id": "24855811",
      "name": "cloud-upload-filled",
      "font_class": "cloud-upload-filled",
      "unicode": "e648",
      "unicode_decimal": 58952
    },
    {
      "icon_id": "24855813",
      "name": "redo",
      "font_class": "redo",
      "unicode": "e64a",
      "unicode_decimal": 58954
    },
    {
      "icon_id": "24855814",
      "name": "images-filled",
      "font_class": "images-filled",
      "unicode": "e64b",
      "unicode_decimal": 58955
    },
    {
      "icon_id": "24855815",
      "name": "undo-filled",
      "font_class": "undo-filled",
      "unicode": "e64c",
      "unicode_decimal": 58956
    },
    {
      "icon_id": "24855816",
      "name": "more",
      "font_class": "more",
      "unicode": "e64d",
      "unicode_decimal": 58957
    },
    {
      "icon_id": "24855817",
      "name": "more-filled",
      "font_class": "more-filled",
      "unicode": "e64e",
      "unicode_decimal": 58958
    },
    {
      "icon_id": "24855818",
      "name": "undo",
      "font_class": "undo",
      "unicode": "e64f",
      "unicode_decimal": 58959
    },
    {
      "icon_id": "24855819",
      "name": "images",
      "font_class": "images",
      "unicode": "e650",
      "unicode_decimal": 58960
    },
    {
      "icon_id": "24855821",
      "name": "paperclip",
      "font_class": "paperclip",
      "unicode": "e652",
      "unicode_decimal": 58962
    },
    {
      "icon_id": "24855822",
      "name": "settings",
      "font_class": "settings",
      "unicode": "e653",
      "unicode_decimal": 58963
    },
    {
      "icon_id": "24855823",
      "name": "search",
      "font_class": "search",
      "unicode": "e654",
      "unicode_decimal": 58964
    },
    {
      "icon_id": "24855824",
      "name": "redo-filled",
      "font_class": "redo-filled",
      "unicode": "e655",
      "unicode_decimal": 58965
    },
    {
      "icon_id": "24841702",
      "name": "list",
      "font_class": "list",
      "unicode": "e644",
      "unicode_decimal": 58948
    },
    {
      "icon_id": "24841489",
      "name": "mail-open-filled",
      "font_class": "mail-open-filled",
      "unicode": "e63a",
      "unicode_decimal": 58938
    },
    {
      "icon_id": "24841491",
      "name": "hand-thumbsdown-filled",
      "font_class": "hand-down-filled",
      "unicode": "e63c",
      "unicode_decimal": 58940
    },
    {
      "icon_id": "24841492",
      "name": "hand-thumbsdown",
      "font_class": "hand-down",
      "unicode": "e63d",
      "unicode_decimal": 58941
    },
    {
      "icon_id": "24841493",
      "name": "hand-thumbsup-filled",
      "font_class": "hand-up-filled",
      "unicode": "e63e",
      "unicode_decimal": 58942
    },
    {
      "icon_id": "24841494",
      "name": "hand-thumbsup",
      "font_class": "hand-up",
      "unicode": "e63f",
      "unicode_decimal": 58943
    },
    {
      "icon_id": "24841496",
      "name": "heart-filled",
      "font_class": "heart-filled",
      "unicode": "e641",
      "unicode_decimal": 58945
    },
    {
      "icon_id": "24841498",
      "name": "mail-open",
      "font_class": "mail-open",
      "unicode": "e643",
      "unicode_decimal": 58947
    },
    {
      "icon_id": "24841488",
      "name": "heart",
      "font_class": "heart",
      "unicode": "e639",
      "unicode_decimal": 58937
    },
    {
      "icon_id": "24839963",
      "name": "loop",
      "font_class": "loop",
      "unicode": "e633",
      "unicode_decimal": 58931
    },
    {
      "icon_id": "24839866",
      "name": "pulldown",
      "font_class": "pulldown",
      "unicode": "e632",
      "unicode_decimal": 58930
    },
    {
      "icon_id": "24813798",
      "name": "scan",
      "font_class": "scan",
      "unicode": "e62a",
      "unicode_decimal": 58922
    },
    {
      "icon_id": "24813786",
      "name": "bars",
      "font_class": "bars",
      "unicode": "e627",
      "unicode_decimal": 58919
    },
    {
      "icon_id": "24813788",
      "name": "cart-filled",
      "font_class": "cart-filled",
      "unicode": "e629",
      "unicode_decimal": 58921
    },
    {
      "icon_id": "24813790",
      "name": "checkbox",
      "font_class": "checkbox",
      "unicode": "e62b",
      "unicode_decimal": 58923
    },
    {
      "icon_id": "24813791",
      "name": "checkbox-filled",
      "font_class": "checkbox-filled",
      "unicode": "e62c",
      "unicode_decimal": 58924
    },
    {
      "icon_id": "24813794",
      "name": "shop",
      "font_class": "shop",
      "unicode": "e62f",
      "unicode_decimal": 58927
    },
    {
      "icon_id": "24813795",
      "name": "headphones",
      "font_class": "headphones",
      "unicode": "e630",
      "unicode_decimal": 58928
    },
    {
      "icon_id": "24813796",
      "name": "cart",
      "font_class": "cart",
      "unicode": "e631",
      "unicode_decimal": 58929
    }
  ]
};
const iconUrl = "/assets/uniicons.89ed7d6d.ttf";
const _style_0$4 = { "uni-icons": { "": { "fontFamily": "uniicons", "textDecoration": "none", "textAlign": "center" } } };
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const getVal = (val) => {
  const reg = /^[0-9]*$/g;
  return typeof val === "number" || reg.test(val) ? val + "px" : val;
};
var domModule = weex.requireModule("dom");
domModule.addRule("fontFace", {
  "fontFamily": "uniicons",
  "src": "url('" + iconUrl + "')"
});
const _sfc_main$5 = {
  name: "UniIcons",
  emits: ["click"],
  props: {
    type: {
      type: String,
      default: ""
    },
    color: {
      type: String,
      default: "#333333"
    },
    size: {
      type: [Number, String],
      default: 16
    },
    customPrefix: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      icons: icons.glyphs
    };
  },
  computed: {
    unicode() {
      let code = this.icons.find((v2) => v2.font_class === this.type);
      if (code) {
        return unescape(`%u${code.unicode}`);
      }
      return "";
    },
    iconSize() {
      return getVal(this.size);
    }
  },
  methods: {
    _onClick() {
      this.$emit("click");
    }
  }
};
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock(
    "u-text",
    {
      style: normalizeStyle({ color: $props.color, "font-size": $options.iconSize }),
      class: "uni-icons",
      onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
    },
    toDisplayString($options.unicode),
    5
    /* TEXT, STYLE */
  );
}
const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["styles", [_style_0$4]], ["__file", "C:/Users/lu175/Desktop/小程序/小灰机/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
const _style_0$3 = { "uni-badge--x": { "": { "position": "relative" } }, "uni-badge--absolute": { "": { "position": "absolute" } }, "uni-badge--small": { "": { "transform": "scale(0.8)", "transformOrigin": "center center" } }, "uni-badge": { "": { "justifyContent": "center", "flexDirection": "row", "height": 20, "paddingTop": 0, "paddingRight": 4, "paddingBottom": 0, "paddingLeft": 4, "lineHeight": 18, "color": "#ffffff", "borderRadius": 100, "backgroundColor": "rgba(0,0,0,0)", "borderWidth": 1, "borderStyle": "solid", "borderColor": "#ffffff", "textAlign": "center", "fontFamily": '"Helvetica Neue", Helvetica, sans-serif', "fontSize": 12 } }, "uni-badge--info": { "": { "color": "#ffffff", "backgroundColor": "#909399" } }, "uni-badge--primary": { "": { "backgroundColor": "#2979ff" } }, "uni-badge--success": { "": { "backgroundColor": "#4cd964" } }, "uni-badge--warning": { "": { "backgroundColor": "#f0ad4e" } }, "uni-badge--error": { "": { "backgroundColor": "#dd524d" } }, "uni-badge--inverted": { "": { "paddingTop": 0, "paddingRight": 5, "paddingBottom": 0, "paddingLeft": 0, "color": "#909399" } }, "uni-badge--info-inverted": { "": { "color": "#909399", "backgroundColor": "rgba(0,0,0,0)" } }, "uni-badge--primary-inverted": { "": { "color": "#2979ff", "backgroundColor": "rgba(0,0,0,0)" } }, "uni-badge--success-inverted": { "": { "color": "#4cd964", "backgroundColor": "rgba(0,0,0,0)" } }, "uni-badge--warning-inverted": { "": { "color": "#f0ad4e", "backgroundColor": "rgba(0,0,0,0)" } }, "uni-badge--error-inverted": { "": { "color": "#dd524d", "backgroundColor": "rgba(0,0,0,0)" } } };
const _sfc_main$4 = {
  name: "UniBadge",
  emits: ["click"],
  props: {
    type: {
      type: String,
      default: "error"
    },
    inverted: {
      type: Boolean,
      default: false
    },
    isDot: {
      type: Boolean,
      default: false
    },
    maxNum: {
      type: Number,
      default: 99
    },
    absolute: {
      type: String,
      default: ""
    },
    offset: {
      type: Array,
      default() {
        return [0, 0];
      }
    },
    text: {
      type: [String, Number],
      default: ""
    },
    size: {
      type: String,
      default: "small"
    },
    customStyle: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {};
  },
  computed: {
    width() {
      return String(this.text).length * 8 + 12;
    },
    classNames() {
      const {
        inverted,
        type,
        size,
        absolute
      } = this;
      return [
        inverted ? "uni-badge--" + type + "-inverted" : "",
        "uni-badge--" + type,
        "uni-badge--" + size,
        absolute ? "uni-badge--absolute" : ""
      ].join(" ");
    },
    positionStyle() {
      if (!this.absolute)
        return {};
      let w2 = this.width / 2, h2 = 10;
      if (this.isDot) {
        w2 = 5;
        h2 = 5;
      }
      const x2 = `${-w2 + this.offset[0]}px`;
      const y2 = `${-h2 + this.offset[1]}px`;
      const whiteList = {
        rightTop: {
          right: x2,
          top: y2
        },
        rightBottom: {
          right: x2,
          bottom: y2
        },
        leftBottom: {
          left: x2,
          bottom: y2
        },
        leftTop: {
          left: x2,
          top: y2
        }
      };
      const match = whiteList[this.absolute];
      return match ? match : whiteList["rightTop"];
    },
    dotStyle() {
      if (!this.isDot)
        return {};
      return {
        width: "10px",
        minWidth: "0",
        height: "10px",
        padding: "0",
        borderRadius: "10px"
      };
    },
    displayValue() {
      const {
        isDot,
        text,
        maxNum
      } = this;
      return isDot ? "" : Number(text) > maxNum ? `${maxNum}+` : text;
    }
  },
  methods: {
    onClick() {
      this.$emit("click");
    }
  }
};
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("view", {
    class: "uni-badge--x",
    renderWhole: true
  }, [
    renderSlot(_ctx.$slots, "default"),
    $props.text ? (openBlock(), createElementBlock(
      "u-text",
      {
        key: 0,
        class: normalizeClass([$options.classNames, "uni-badge"]),
        style: normalizeStyle([$options.positionStyle, $props.customStyle, $options.dotStyle]),
        onClick: _cache[0] || (_cache[0] = ($event) => $options.onClick())
      },
      toDisplayString($options.displayValue),
      7
      /* TEXT, CLASS, STYLE */
    )) : createCommentVNode("v-if", true)
  ]);
}
const __easycom_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["styles", [_style_0$3]], ["__file", "C:/Users/lu175/Desktop/小程序/小灰机/uni_modules/uni-badge/components/uni-badge/uni-badge.vue"]]);
const _style_0$2 = { "uni-list-item": { "": { "fontSize": 16, "position": "relative", "justifyContent": "space-between", "alignItems": "center", "backgroundColor": "#ffffff", "flexDirection": "row" } }, "uni-list-item--disabled": { "": { "opacity": 0.3 } }, "uni-list-item--hover": { "": { "!backgroundColor": "#f1f1f1" } }, "uni-list-item__container": { "": { "position": "relative", "flexDirection": "row", "paddingTop": 12, "paddingRight": 15, "paddingBottom": 12, "paddingLeft": 15, "flex": 1, "overflow": "hidden" } }, "container--right": { "": { "paddingRight": 0 } }, "uni-list--border": { "": { "position": "absolute", "top": 0, "right": 0, "left": 0, "borderTopColor": "#e5e5e5", "borderTopStyle": "solid", "borderTopWidth": 0.5 } }, "uni-list-item__content": { "": { "paddingRight": 8, "flex": 1, "color": "#3b4144", "flexDirection": "column", "justifyContent": "space-between", "overflow": "hidden" } }, "uni-list-item__content--center": { "": { "justifyContent": "center" } }, "uni-list-item__content-title": { "": { "fontSize": 14, "color": "#3b4144", "overflow": "hidden" } }, "uni-list-item__content-note": { "": { "marginTop": "6rpx", "color": "#999999", "fontSize": 12, "overflow": "hidden" } }, "uni-list-item__extra": { "": { "flexDirection": "row", "justifyContent": "flex-end", "alignItems": "center" } }, "uni-list-item__header": { "": { "flexDirection": "row", "alignItems": "center" } }, "uni-list-item__icon": { "": { "marginRight": "18rpx", "flexDirection": "row", "justifyContent": "center", "alignItems": "center" } }, "uni-list-item__icon-img": { "": { "height": 26, "width": 26, "marginRight": 10 } }, "uni-icon-wrapper": { "": { "alignItems": "center", "paddingTop": 0, "paddingRight": 10, "paddingBottom": 0, "paddingLeft": 10 } }, "flex--direction": { "": { "flexDirection": "column" } }, "uni-list--lg": { "": { "height": 40, "width": 40 } }, "uni-list--base": { "": { "height": 26, "width": 26 } }, "uni-list--sm": { "": { "height": 20, "width": 20 } }, "uni-list-item__extra-text": { "": { "color": "#999999", "fontSize": 12 } }, "uni-ellipsis-1": { "": { "lines": 1, "textOverflow": "ellipsis" } }, "uni-ellipsis-2": { "": { "lines": 2, "textOverflow": "ellipsis" } } };
const _sfc_main$3 = {
  name: "UniListItem",
  emits: ["click", "switchChange"],
  props: {
    direction: {
      type: String,
      default: "row"
    },
    title: {
      type: String,
      default: ""
    },
    note: {
      type: String,
      default: ""
    },
    ellipsis: {
      type: [Number, String],
      default: 0
    },
    disabled: {
      type: [Boolean, String],
      default: false
    },
    clickable: {
      type: Boolean,
      default: false
    },
    showArrow: {
      type: [Boolean, String],
      default: false
    },
    link: {
      type: [Boolean, String],
      default: false
    },
    to: {
      type: String,
      default: ""
    },
    showBadge: {
      type: [Boolean, String],
      default: false
    },
    showSwitch: {
      type: [Boolean, String],
      default: false
    },
    switchChecked: {
      type: [Boolean, String],
      default: false
    },
    badgeText: {
      type: String,
      default: ""
    },
    badgeType: {
      type: String,
      default: "success"
    },
    badgeStyle: {
      type: Object,
      default() {
        return {};
      }
    },
    rightText: {
      type: String,
      default: ""
    },
    thumb: {
      type: String,
      default: ""
    },
    thumbSize: {
      type: String,
      default: "base"
    },
    showExtraIcon: {
      type: [Boolean, String],
      default: false
    },
    extraIcon: {
      type: Object,
      default() {
        return {
          type: "",
          color: "#000000",
          size: 20,
          customPrefix: ""
        };
      }
    },
    border: {
      type: Boolean,
      default: true
    },
    customStyle: {
      type: Object,
      default() {
        return {
          padding: "",
          backgroundColor: "#FFFFFF"
        };
      }
    },
    keepScrollPosition: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    "customStyle.padding": {
      handler(padding) {
        if (typeof padding == "number") {
          padding += "";
        }
        let paddingArr = padding.split(" ");
        if (paddingArr.length === 1) {
          const allPadding = paddingArr[0];
          this.padding = {
            "top": allPadding,
            "right": allPadding,
            "bottom": allPadding,
            "left": allPadding
          };
        } else if (paddingArr.length === 2) {
          const [verticalPadding, horizontalPadding] = paddingArr;
          this.padding = {
            "top": verticalPadding,
            "right": horizontalPadding,
            "bottom": verticalPadding,
            "left": horizontalPadding
          };
        } else if (paddingArr.length === 4) {
          const [topPadding, rightPadding, bottomPadding, leftPadding] = paddingArr;
          this.padding = {
            "top": topPadding,
            "right": rightPadding,
            "bottom": bottomPadding,
            "left": leftPadding
          };
        }
      },
      immediate: true
    }
  },
  // inject: ['list'],
  data() {
    return {
      isFirstChild: false,
      padding: {
        top: "",
        right: "",
        bottom: "",
        left: ""
      }
    };
  },
  mounted() {
    this.list = this.getForm();
    if (this.list) {
      if (!this.list.firstChildAppend) {
        this.list.firstChildAppend = true;
        this.isFirstChild = true;
      }
    }
  },
  methods: {
    /**
     * 获取父元素实例
     */
    getForm(name = "uniList") {
      let parent = this.$parent;
      let parentName = parent.$options.name;
      while (parentName !== name) {
        parent = parent.$parent;
        if (!parent)
          return false;
        parentName = parent.$options.name;
      }
      return parent;
    },
    onClick() {
      if (this.to !== "") {
        this.openPage();
        return;
      }
      if (this.clickable || this.link) {
        this.$emit("click", {
          data: {}
        });
      }
    },
    onSwitchChange(e) {
      this.$emit("switchChange", e.detail);
    },
    openPage() {
      if (["navigateTo", "redirectTo", "reLaunch", "switchTab"].indexOf(this.link) !== -1) {
        this.pageApi(this.link);
      } else {
        this.pageApi("navigateTo");
      }
    },
    pageApi(api) {
      let callback = {
        url: this.to,
        success: (res) => {
          this.$emit("click", {
            data: res
          });
        },
        fail: (err) => {
          this.$emit("click", {
            data: err
          });
        }
      };
      switch (api) {
        case "navigateTo":
          uni.navigateTo(callback);
          break;
        case "redirectTo":
          uni.redirectTo(callback);
          break;
        case "reLaunch":
          uni.reLaunch(callback);
          break;
        case "switchTab":
          uni.switchTab(callback);
          break;
        default:
          uni.navigateTo(callback);
      }
    }
  }
};
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_uni_icons = resolveEasycom(resolveDynamicComponent("uni-icons"), __easycom_0$1);
  const _component_uni_badge = resolveEasycom(resolveDynamicComponent("uni-badge"), __easycom_1$1);
  const _component_switch = resolveComponent("switch");
  return openBlock(), createElementBlock("cell", { keepScrollPosition: $props.keepScrollPosition }, [
    createElementVNode("view", {
      class: normalizeClass([{ "uni-list-item--disabled": $props.disabled }, "uni-list-item"]),
      style: normalizeStyle({ "background-color": $props.customStyle.backgroundColor }),
      hoverClass: !$props.clickable && !$props.link || $props.disabled || $props.showSwitch ? "" : "uni-list-item--hover",
      onClick: _cache[0] || (_cache[0] = (...args) => $options.onClick && $options.onClick(...args))
    }, [
      !$data.isFirstChild ? (openBlock(), createElementBlock(
        "view",
        {
          key: 0,
          class: normalizeClass(["border--left", { "uni-list--border": $props.border }])
        },
        null,
        2
        /* CLASS */
      )) : createCommentVNode("v-if", true),
      createElementVNode(
        "view",
        {
          class: normalizeClass(["uni-list-item__container", { "container--right": $props.showArrow || $props.link, "flex--direction": $props.direction === "column" }]),
          style: normalizeStyle({ paddingTop: $data.padding.top, paddingLeft: $data.padding.left, paddingRight: $data.padding.right, paddingBottom: $data.padding.bottom })
        },
        [
          renderSlot(_ctx.$slots, "header", {}, () => [
            createElementVNode("view", { class: "uni-list-item__header" }, [
              $props.thumb ? (openBlock(), createElementBlock("view", {
                key: 0,
                class: "uni-list-item__icon"
              }, [
                createElementVNode("u-image", {
                  src: $props.thumb,
                  class: normalizeClass(["uni-list-item__icon-img", ["uni-list--" + $props.thumbSize]])
                }, null, 10, ["src"])
              ])) : $props.showExtraIcon ? (openBlock(), createElementBlock("view", {
                key: 1,
                class: "uni-list-item__icon"
              }, [
                createVNode(_component_uni_icons, {
                  customPrefix: $props.extraIcon.customPrefix,
                  color: $props.extraIcon.color,
                  size: $props.extraIcon.size,
                  type: $props.extraIcon.type
                }, null, 8, ["customPrefix", "color", "size", "type"])
              ])) : createCommentVNode("v-if", true)
            ])
          ]),
          renderSlot(_ctx.$slots, "body", {}, () => [
            createElementVNode(
              "view",
              {
                class: normalizeClass(["uni-list-item__content", { "uni-list-item__content--center": $props.thumb || $props.showExtraIcon || $props.showBadge || $props.showSwitch }])
              },
              [
                $props.title ? (openBlock(), createElementBlock(
                  "u-text",
                  {
                    key: 0,
                    class: normalizeClass(["uni-list-item__content-title", [$props.ellipsis !== 0 && $props.ellipsis <= 2 ? "uni-ellipsis-" + $props.ellipsis : ""]])
                  },
                  toDisplayString($props.title),
                  3
                  /* TEXT, CLASS */
                )) : createCommentVNode("v-if", true),
                $props.note ? (openBlock(), createElementBlock(
                  "u-text",
                  {
                    key: 1,
                    class: "uni-list-item__content-note"
                  },
                  toDisplayString($props.note),
                  1
                  /* TEXT */
                )) : createCommentVNode("v-if", true)
              ],
              2
              /* CLASS */
            )
          ]),
          renderSlot(_ctx.$slots, "footer", {}, () => [
            $props.rightText || $props.showBadge || $props.showSwitch ? (openBlock(), createElementBlock(
              "view",
              {
                key: 0,
                class: normalizeClass(["uni-list-item__extra", { "flex--justify": $props.direction === "column" }])
              },
              [
                $props.rightText ? (openBlock(), createElementBlock(
                  "u-text",
                  {
                    key: 0,
                    class: "uni-list-item__extra-text"
                  },
                  toDisplayString($props.rightText),
                  1
                  /* TEXT */
                )) : createCommentVNode("v-if", true),
                $props.showBadge ? (openBlock(), createBlock(_component_uni_badge, {
                  key: 1,
                  type: $props.badgeType,
                  text: $props.badgeText,
                  "custom-style": $props.badgeStyle
                }, null, 8, ["type", "text", "custom-style"])) : createCommentVNode("v-if", true),
                $props.showSwitch ? (openBlock(), createBlock(_component_switch, {
                  key: 2,
                  disabled: $props.disabled,
                  checked: $props.switchChecked,
                  onChange: $options.onSwitchChange
                }, null, 8, ["disabled", "checked", "onChange"])) : createCommentVNode("v-if", true)
              ],
              2
              /* CLASS */
            )) : createCommentVNode("v-if", true)
          ])
        ],
        6
        /* CLASS, STYLE */
      ),
      $props.showArrow || $props.link ? (openBlock(), createBlock(_component_uni_icons, {
        key: 1,
        size: 16,
        class: "uni-icon-wrapper",
        color: "#bbb",
        type: "arrowright"
      })) : createCommentVNode("v-if", true)
    ], 14, ["hoverClass"])
  ], 8, ["keepScrollPosition"]);
}
const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["styles", [_style_0$2]], ["__file", "C:/Users/lu175/Desktop/小程序/小灰机/uni_modules/uni-list/components/uni-list-item/uni-list-item.vue"]]);
const _style_0$1 = { "uni-list": { "": { "backgroundColor": "#ffffff", "position": "relative", "flexDirection": "column" } }, "uni-list--border": { "": { "position": "relative", "borderTopColor": "#e5e5e5", "borderTopStyle": "solid", "borderTopWidth": 0.5, "borderBottomColor": "#e5e5e5", "borderBottomStyle": "solid", "borderBottomWidth": 0.5, "zIndex": -1 } } };
const _sfc_main$2 = {
  name: "uniList",
  "mp-weixin": {
    options: {
      multipleSlots: false
    }
  },
  props: {
    stackFromEnd: {
      type: Boolean,
      default: false
    },
    enableBackToTop: {
      type: [Boolean, String],
      default: false
    },
    scrollY: {
      type: [Boolean, String],
      default: false
    },
    border: {
      type: Boolean,
      default: true
    },
    renderReverse: {
      type: Boolean,
      default: false
    }
  },
  // provide() {
  // 	return {
  // 		list: this
  // 	};
  // },
  created() {
    this.firstChildAppend = false;
  },
  methods: {
    loadMore(e) {
      this.$emit("scrolltolower");
    },
    scroll(e) {
      this.$emit("scroll", e);
    }
  }
};
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("list", {
    bounce: false,
    scrollable: true,
    showScrollbar: "",
    renderReverse: $props.renderReverse,
    onScroll: _cache[0] || (_cache[0] = (...args) => $options.scroll && $options.scroll(...args)),
    class: normalizeClass(["uni-list", { "uni-list--border": $props.border }]),
    enableBackToTop: $props.enableBackToTop,
    loadmoreoffset: "15"
  }, [
    renderSlot(_ctx.$slots, "default")
  ], 42, ["renderReverse", "enableBackToTop"]);
}
const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["styles", [_style_0$1]], ["__file", "C:/Users/lu175/Desktop/小程序/小灰机/uni_modules/uni-list/components/uni-list/uni-list.vue"]]);
const en = {
  "uniCloud.component.add.success": "Success",
  "uniCloud.component.update.success": "Success",
  "uniCloud.component.remove.showModal.title": "Tips",
  "uniCloud.component.remove.showModal.content": "是否删除该数据"
};
const es = {
  "uniCloud.component.add.success": "新增成功",
  "uniCloud.component.update.success": "修改成功",
  "uniCloud.component.remove.showModal.title": "提示",
  "uniCloud.component.remove.showModal.content": "是否删除该数据"
};
const fr = {
  "uniCloud.component.add.success": "新增成功",
  "uniCloud.component.update.success": "修改成功",
  "uniCloud.component.remove.showModal.title": "提示",
  "uniCloud.component.remove.showModal.content": "是否删除该数据"
};
const zhHans = {
  "uniCloud.component.add.success": "新增成功",
  "uniCloud.component.update.success": "修改成功",
  "uniCloud.component.remove.showModal.title": "提示",
  "uniCloud.component.remove.showModal.content": "是否删除该数据"
};
const zhHant = {
  "uniCloud.component.add.success": "新增成功",
  "uniCloud.component.update.success": "修改成功",
  "uniCloud.component.remove.showModal.title": "提示",
  "uniCloud.component.remove.showModal.content": "是否刪除數據"
};
const messages = {
  en,
  es,
  fr,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant
};
const isArray = Array.isArray;
const { t } = initVueI18n(messages);
const events = {
  load: "load",
  error: "error"
};
const pageMode = {
  add: "add",
  replace: "replace"
};
const loadMode = {
  auto: "auto",
  onready: "onready",
  manual: "manual"
};
const attrs = [
  "pageCurrent",
  "pageSize",
  "collection",
  "action",
  "field",
  "getcount",
  "orderby",
  "where",
  "groupby",
  "groupField",
  "distinct"
];
const _sfc_main$1 = {
  name: "UniClouddb",
  setup(props) {
    const dataListRef = props.ssrKey ? props.getone ? shallowSsrRef(void 0, props.ssrKey) : ssrRef([], props.ssrKey) : props.getone ? shallowSsrRef(void 0, "n5CSWvLk5Y153iXLhXxKuw==") : ssrRef([], "gcfw5H9OcmgxY4Hykzu+qQ==");
    const instance = getCurrentInstance();
    onMounted(() => {
      if ((!dataListRef.value || dataListRef.value.length === 0) && !props.manual && props.loadtime === loadMode.auto) {
        instance.proxy.loadData();
      }
    });
    return { dataList: dataListRef };
  },
  // 服务端serverPrefetch生命周期，用于服务端加载数据，等将来全端支持Suspense时，可以采用 Suspense + async setup 来实现一版
  async serverPrefetch() {
    if (!this.manual && this.loadtime === loadMode.auto) {
      return this.loadData();
    }
  },
  props: {
    options: {
      type: [Object, Array],
      default() {
        return {};
      }
    },
    spaceInfo: {
      type: Object,
      default() {
        return {};
      }
    },
    collection: {
      type: [String, Array],
      default: ""
    },
    action: {
      type: String,
      default: ""
    },
    field: {
      type: String,
      default: ""
    },
    orderby: {
      type: String,
      default: ""
    },
    where: {
      type: [String, Object],
      default: ""
    },
    pageData: {
      type: String,
      default: "add"
    },
    pageCurrent: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 20
    },
    getcount: {
      type: [Boolean, String],
      default: false
    },
    getone: {
      type: [Boolean, String],
      default: false
    },
    gettree: {
      type: [Boolean, String, Object],
      default: false
    },
    gettreepath: {
      type: [Boolean, String],
      default: false
    },
    startwith: {
      type: String,
      default: ""
    },
    limitlevel: {
      type: Number,
      default: 10
    },
    groupby: {
      type: String,
      default: ""
    },
    groupField: {
      type: String,
      default: ""
    },
    distinct: {
      type: [Boolean, String],
      default: false
    },
    pageIndistinct: {
      type: [Boolean, String],
      default: false
    },
    foreignKey: {
      type: String,
      default: ""
    },
    loadtime: {
      type: String,
      default: "auto"
    },
    manual: {
      type: Boolean,
      default: false
    },
    ssrKey: {
      type: [String, Number],
      default: ""
    }
  },
  data() {
    return {
      loading: false,
      hasMore: false,
      paginationInternal: {},
      errorMessage: ""
    };
  },
  computed: {
    collectionArgs() {
      return isArray(this.collection) ? this.collection : [this.collection];
    },
    isLookup() {
      return isArray(this.collection) && this.collection.length > 1 || typeof this.collection === "string" && this.collection.indexOf(",") > -1;
    },
    mainCollection() {
      if (typeof this.collection === "string") {
        return this.collection.split(",")[0];
      }
      const mainQuery = JSON.parse(JSON.stringify(this.collection[0]));
      return mainQuery.$db[0].$param[0];
    }
  },
  created() {
    this._isEnded = false;
    this.paginationInternal = {
      current: this.pageCurrent,
      size: this.pageSize,
      count: 0
    };
    this.$watch(() => {
      var al = [];
      attrs.forEach((key) => {
        al.push(this[key]);
      });
      return al;
    }, (newValue, oldValue) => {
      this.paginationInternal.size = this.pageSize;
      if (newValue[0] !== oldValue[0]) {
        this.paginationInternal.current = this.pageCurrent;
      }
      if (this.loadtime === loadMode.manual) {
        return;
      }
      let needReset = false;
      for (let i2 = 2; i2 < newValue.length; i2++) {
        if (newValue[i2] !== oldValue[i2]) {
          needReset = true;
          break;
        }
      }
      if (needReset) {
        this.clear();
        this.reset();
      }
      this._execLoadData();
    });
  },
  methods: {
    loadData(args1, args2) {
      let callback = null;
      let clear = false;
      if (typeof args1 === "object") {
        if (args1.clear) {
          if (this.pageData === pageMode.replace) {
            this.clear();
          } else {
            clear = args1.clear;
          }
          this.reset();
        }
        if (args1.current !== void 0) {
          this.paginationInternal.current = args1.current;
        }
        if (typeof args2 === "function") {
          callback = args2;
        }
      } else if (typeof args1 === "function") {
        callback = args1;
      }
      return this._execLoadData(callback, clear);
    },
    loadMore() {
      if (this._isEnded || this.loading) {
        return;
      }
      if (this.pageData === pageMode.add) {
        this.paginationInternal.current++;
      }
      this._execLoadData();
    },
    refresh() {
      this.clear();
      this._execLoadData();
    },
    clear() {
      this._isEnded = false;
      this.dataList = [];
    },
    reset() {
      this.paginationInternal.current = 1;
    },
    add(value, {
      action,
      showToast = true,
      toastTitle,
      success,
      fail,
      complete,
      needConfirm = true,
      needLoading = true,
      loadingTitle = ""
    } = {}) {
      if (needLoading) {
        uni.showLoading({
          title: loadingTitle
        });
      }
      let db = Ds.database(this.spaceInfo);
      if (action) {
        db = db.action(action);
      }
      db.collection(this.mainCollection).add(value).then((res) => {
        success && success(res);
        if (showToast) {
          uni.showToast({
            title: toastTitle || t("uniCloud.component.add.success")
          });
        }
      }).catch((err) => {
        fail && fail(err);
        if (needConfirm) {
          uni.showModal({
            content: err.message,
            showCancel: false
          });
        }
      }).finally(() => {
        if (needLoading) {
          uni.hideLoading();
        }
        complete && complete();
      });
    },
    remove(id, {
      action,
      success,
      fail,
      complete,
      confirmTitle,
      confirmContent,
      needConfirm = true,
      needLoading = true,
      loadingTitle = ""
    } = {}) {
      if (!id || !id.length) {
        return;
      }
      if (!needConfirm) {
        this._execRemove(id, action, success, fail, complete, needConfirm, needLoading, loadingTitle);
        return;
      }
      uni.showModal({
        title: confirmTitle || t("uniCloud.component.remove.showModal.title"),
        content: confirmContent || t("uniCloud.component.remove.showModal.content"),
        showCancel: true,
        success: (res) => {
          if (!res.confirm) {
            return;
          }
          this._execRemove(id, action, success, fail, complete, needConfirm, needLoading, loadingTitle);
        }
      });
    },
    update(id, value, {
      action,
      showToast = true,
      toastTitle,
      success,
      fail,
      complete,
      needConfirm = true,
      needLoading = true,
      loadingTitle = ""
    } = {}) {
      if (needLoading) {
        uni.showLoading({
          title: loadingTitle
        });
      }
      let db = Ds.database(this.spaceInfo);
      if (action) {
        db = db.action(action);
      }
      return db.collection(this.mainCollection).doc(id).update(value).then((res) => {
        success && success(res);
        if (showToast) {
          uni.showToast({
            title: toastTitle || t("uniCloud.component.update.success")
          });
        }
      }).catch((err) => {
        fail && fail(err);
        if (needConfirm) {
          uni.showModal({
            content: err.message,
            showCancel: false
          });
        }
      }).finally(() => {
        if (needLoading) {
          uni.hideLoading();
        }
        complete && complete();
      });
    },
    getTemp(isTemp = true) {
      let db = Ds.database(this.spaceInfo);
      if (this.action) {
        db = db.action(this.action);
      }
      db = db.collection(...this.collectionArgs);
      if (this.foreignKey) {
        db = db.foreignKey(this.foreignKey);
      }
      if (!(!this.where || !Object.keys(this.where).length)) {
        db = db.where(this.where);
      }
      if (this.field) {
        db = db.field(this.field);
      }
      if (this.groupby) {
        db = db.groupBy(this.groupby);
      }
      if (this.groupField) {
        db = db.groupField(this.groupField);
      }
      if (this.distinct === true) {
        db = db.distinct();
      }
      if (this.orderby) {
        db = db.orderBy(this.orderby);
      }
      const {
        current,
        size
      } = this.paginationInternal;
      const getOptions = {};
      if (this.getcount) {
        getOptions.getCount = this.getcount;
      }
      const treeOptions = {
        limitLevel: this.limitlevel,
        startWith: this.startwith
      };
      if (this.gettree) {
        getOptions.getTree = treeOptions;
      }
      if (this.gettreepath) {
        getOptions.getTreePath = treeOptions;
      }
      db = db.skip(size * (current - 1)).limit(size);
      if (isTemp) {
        db = db.getTemp(getOptions);
        db.udb = this;
      } else {
        db = db.get(getOptions);
      }
      return db;
    },
    setResult(result) {
      if (result.code === 0) {
        this._execLoadDataSuccess(result);
      } else {
        this._execLoadDataFail(new Error(result.message));
      }
    },
    _execLoadData(callback, clear) {
      if (this.loading) {
        return;
      }
      this.loading = true;
      this.errorMessage = "";
      return this._getExec().then((res) => {
        this.loading = false;
        this._execLoadDataSuccess(res.result, callback, clear);
      }).catch((err) => {
        this.loading = false;
        this._execLoadDataFail(err, callback);
      });
    },
    _execLoadDataSuccess(result, callback, clear) {
      const {
        data,
        count
      } = result;
      this._isEnded = count !== void 0 ? this.paginationInternal.current * this.paginationInternal.size >= count : data.length < this.pageSize;
      this.hasMore = !this._isEnded;
      const data2 = this.getone ? data.length ? data[0] : void 0 : data;
      if (this.getcount) {
        this.paginationInternal.count = count;
      }
      callback && callback(data2, this._isEnded, this.paginationInternal);
      this._dispatchEvent(events.load, data2);
      if (this.getone || this.pageData === pageMode.replace) {
        this.dataList = data2;
      } else {
        if (clear) {
          this.dataList = data2;
        } else {
          this.dataList.push(...data2);
        }
      }
    },
    _execLoadDataFail(err, callback) {
      this.errorMessage = err;
      callback && callback();
      this.$emit(events.error, err);
      {
        console.error(err);
      }
    },
    _getExec() {
      return this.getTemp(false);
    },
    _execRemove(id, action, success, fail, complete, needConfirm, needLoading, loadingTitle) {
      if (!this.collection || !id) {
        return;
      }
      const ids = isArray(id) ? id : [id];
      if (!ids.length) {
        return;
      }
      if (needLoading) {
        uni.showLoading({
          mask: true,
          title: loadingTitle
        });
      }
      const db = Ds.database(this.spaceInfo);
      const dbCmd = db.command;
      let exec = db;
      if (action) {
        exec = exec.action(action);
      }
      exec.collection(this.mainCollection).where({
        _id: dbCmd.in(ids)
      }).remove().then((res) => {
        success && success(res.result);
        if (this.pageData === pageMode.replace) {
          this.refresh();
        } else {
          this.removeData(ids);
        }
      }).catch((err) => {
        fail && fail(err);
        if (needConfirm) {
          uni.showModal({
            content: err.message,
            showCancel: false
          });
        }
      }).finally(() => {
        if (needLoading) {
          uni.hideLoading();
        }
        complete && complete();
      });
    },
    removeData(ids) {
      const il = ids.slice(0);
      const dl = this.dataList;
      for (let i2 = dl.length - 1; i2 >= 0; i2--) {
        const index = il.indexOf(dl[i2]._id);
        if (index >= 0) {
          dl.splice(i2, 1);
          il.splice(index, 1);
        }
      }
    },
    _dispatchEvent(type, data) {
      if (this._changeDataFunction) {
        this._changeDataFunction(data, this._isEnded, this.paginationInternal);
      } else {
        this.$emit(type, data, this._isEnded, this.paginationInternal);
      }
    }
  }
};
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("view", { renderWhole: true }, [
    renderSlot(_ctx.$slots, "default", {
      options: $props.options,
      data: $setup.dataList,
      pagination: $data.paginationInternal,
      loading: $data.loading,
      hasMore: $data.hasMore,
      error: $data.errorMessage
    })
  ]);
}
const __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__file", "D:/应用/HBuilderX/plugins/uniapp-cli-vite/node_modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.vue"]]);
const _style_0 = { "m-auto": { "": { "marginTop": 50, "marginBottom": 50, "textAlign": "center" } }, "s-25": { "": { "fontSize": 25 } }, "loading": { "": { "fontSize": 25, "marginTop": 250, "marginBottom": 250, "width": 30, "height": 30, "borderRadius": 50, "borderWidth": 2, "borderStyle": "solid", "borderColor": "#7FFFD4", "borderTopColor": "#ffffff", "animation": "load 0.6s linear infinite" } }, "@FONT-FACE": [{}] };
Ds.database();
const _sfc_main = {
  data() {
    return {
      name: "",
      time: null
    };
  },
  computed: {
    where() {
      if (this.name) {
        return {
          name: this.name
        };
      }
    }
  },
  onNavigationBarSearchInputChanged(search) {
    clearTimeout(this.time);
    this.time = setTimeout(() => {
      this.name = search.text;
    }, 500);
  },
  onLoad() {
    formatAppLog("log", "at pages/list/list.nvue:41", this.$refs.loading);
  },
  methods: {
    loadData() {
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_uni_list_item = resolveEasycom(resolveDynamicComponent("uni-list-item"), __easycom_0);
  const _component_uni_list = resolveEasycom(resolveDynamicComponent("uni-list"), __easycom_1);
  const _component_unicloud_db = resolveEasycom(resolveDynamicComponent("unicloud-db"), __easycom_2);
  return openBlock(), createElementBlock("scroll-view", {
    scrollY: true,
    showScrollbar: false,
    enableBackToTop: true,
    bubble: "true",
    style: { flexDirection: "column" }
  }, [
    createElementVNode("view", { class: "list" }, [
      createVNode(_component_unicloud_db, {
        ref: "udb",
        collection: "game-list",
        where: $options.where
      }, {
        default: withCtx(({ data, loading, error, options }) => [
          error ? (openBlock(), createElementBlock("view", {
            key: 0,
            class: "s-25 m-auto"
          }, [
            createElementVNode(
              "u-text",
              null,
              toDisplayString(error.message),
              1
              /* TEXT */
            )
          ])) : (openBlock(), createElementBlock("view", { key: 1 }, [
            createVNode(
              _component_uni_list,
              null,
              {
                default: withCtx(() => [
                  (openBlock(true), createElementBlock(
                    Fragment,
                    null,
                    renderList(data, (item, i2) => {
                      return openBlock(), createBlock(_component_uni_list_item, {
                        class: "item",
                        key: i2,
                        title: item.name,
                        link: "",
                        to: item.to
                      }, null, 8, ["title", "to"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ]),
                _: 2
                /* DYNAMIC */
              },
              1024
              /* DYNAMIC_SLOTS */
            )
          ])),
          createElementVNode(
            "view",
            {
              ref: "loading",
              class: "loading"
            },
            null,
            512
            /* NEED_PATCH */
          )
        ]),
        _: 1
        /* STABLE */
      }, 8, ["where"])
    ])
  ]);
}
const list = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["styles", [_style_0]], ["__file", "C:/Users/lu175/Desktop/小程序/小灰机/pages/list/list.nvue"]]);
export {
  list as default
};
