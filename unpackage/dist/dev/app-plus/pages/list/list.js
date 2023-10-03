"use weex:vue";

if (typeof Promise !== 'undefined' && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor
    return this.then(
      value => promise.resolve(callback()).then(() => value),
      reason => promise.resolve(callback()).then(() => {
        throw reason
      })
    )
  }
};

if (typeof uni !== 'undefined' && uni && uni.requireGlobal) {
  const global = uni.requireGlobal()
  ArrayBuffer = global.ArrayBuffer
  Int8Array = global.Int8Array
  Uint8Array = global.Uint8Array
  Uint8ClampedArray = global.Uint8ClampedArray
  Int16Array = global.Int16Array
  Uint16Array = global.Uint16Array
  Int32Array = global.Int32Array
  Uint32Array = global.Uint32Array
  Float32Array = global.Float32Array
  Float64Array = global.Float64Array
  BigInt64Array = global.BigInt64Array
  BigUint64Array = global.BigUint64Array
};


(() => {
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

  // vue-ns:vue
  var require_vue = __commonJS({
    "vue-ns:vue"(exports, module) {
      module.exports = Vue;
    }
  });

  // C:/Users/lu175/Desktop/小程序/小灰机/unpackage/dist/dev/.nvue/pages/list/list.js
  var import_vue = __toESM(require_vue());
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  var _style_0$1 = { "refresh-view": { "": { "width": "750rpx", "height": 80, "flexDirection": "row", "alignItems": "center", "justifyContent": "center" } }, "list": { "": { "flex": 1, "backgroundColor": "#ebebeb" } }, "list-item": { "": { "marginLeft": 12, "marginRight": 12, "marginTop": 12, "paddingTop": 20, "paddingRight": 20, "paddingBottom": 20, "paddingLeft": 20, "backgroundColor": "#ffffff", "borderRadius": 5 } } };
  var _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  var _sfc_main$1 = {
    props: {
      pid: {
        type: [Number, String],
        default: ""
      },
      parentId: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        scrollable: true,
        dataList: [],
        refreshing: false,
        refreshText: "",
        refreshFlag: false
      };
    },
    created() {
      for (var i = 1; i < 32; i++) {
        this.dataList.push({
          id: i,
          name: i
        });
      }
    },
    methods: {
      onclick(e) {
        formatAppLog("log", "at pages/list/nvue-swiper-page.nvue:48", "onclick");
      },
      loadData() {
      },
      clear() {
        this.dataList.length = 0;
      },
      onrefresh(e) {
        this.refreshing = true;
        this.refreshText = "\u5237\u65B0\u4E2D...";
        setTimeout(() => {
          this.refreshing = false;
          this.refreshFlag = false;
          this.refreshText = "\u5DF2\u5237\u65B0";
        }, 2e3);
      },
      onpullingdown(e) {
        if (this.refreshing) {
          return;
        }
        this.pulling = false;
        if (Math.abs(e.pullingDistance) > Math.abs(e.viewHeight)) {
          this.refreshFlag = true;
          this.refreshText = "\u91CA\u653E\u7ACB\u5373\u5237\u65B0";
        } else {
          this.refreshFlag = false;
          this.refreshText = "\u4E0B\u62C9\u53EF\u4EE5\u5237\u65B0";
        }
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return (0, import_vue.openBlock)(), (0, import_vue.createElementBlock)("list", {
      class: "list",
      offsetAccuracy: 6,
      bounce: true,
      isSwiperList: "true"
    }, [
      (0, import_vue.createElementVNode)("refresh", {
        class: "refresh",
        onRefresh: _cache[0] || (_cache[0] = (...args) => $options.onrefresh && $options.onrefresh(...args)),
        onPullingdown: _cache[1] || (_cache[1] = (...args) => $options.onpullingdown && $options.onpullingdown(...args)),
        display: $data.refreshing ? "show" : "hide"
      }, [
        (0, import_vue.createElementVNode)("div", { class: "refresh-view" }, [
          (0, import_vue.createElementVNode)(
            "u-text",
            { class: "loading-text" },
            (0, import_vue.toDisplayString)($data.refreshText),
            1
            /* TEXT */
          )
        ])
      ], 40, ["display"]),
      ((0, import_vue.openBlock)(true), (0, import_vue.createElementBlock)(
        import_vue.Fragment,
        null,
        (0, import_vue.renderList)($data.dataList, (item, index) => {
          return (0, import_vue.openBlock)(), (0, import_vue.createElementBlock)("cell", {
            key: item.id,
            onClick: _cache[2] || (_cache[2] = (...args) => $options.onclick && $options.onclick(...args))
          }, [
            (0, import_vue.createElementVNode)("view", { class: "list-item" }, [
              (0, import_vue.createElementVNode)(
                "u-text",
                null,
                (0, import_vue.toDisplayString)(item.name),
                1
                /* TEXT */
              )
            ])
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      ))
    ]);
  }
  var swiperPage = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["styles", [_style_0$1]], ["__file", "C:/Users/lu175/Desktop/\u5C0F\u7A0B\u5E8F/\u5C0F\u7070\u673A/pages/list/nvue-swiper-page.nvue"]]);
  var _style_0 = { "page": { "": { "flex": 1 } }, "flexible-view": { "": { "backgroundColor": "#f823ff" } }, "tabs": { "": { "flex": 1, "flexDirection": "column", "overflow": "hidden", "backgroundColor": "#ffffff" } }, "tab-bar": { "": { "width": "750rpx", "height": "84rpx", "flexDirection": "row" } }, "scroll-view-indicator": { "": { "position": "relative", "height": 2, "backgroundColor": "rgba(0,0,0,0)" } }, "scroll-view-underline": { "": { "position": "absolute", "top": 0, "bottom": 0, "width": 0, "backgroundColor": "#007AFF" } }, "scroll-view-animation": { "": { "transitionDuration": 200, "transitionProperty": "left" } }, "tab-bar-line": { "": { "height": "1rpx", "backgroundColor": "#cccccc" } }, "tab-view": { "": { "flex": 1 } }, "uni-tab-item": { "": { "flexWrap": "nowrap", "paddingLeft": 25, "paddingRight": 25 } }, "uni-tab-item-title": { "": { "color": "#555555", "fontSize": "30rpx", "height": "80rpx", "lineHeight": "80rpx", "flexWrap": "nowrap" } }, "uni-tab-item-title-active": { "": { "color": "#007AFF" } }, "swiper-item": { "": { "flex": 1, "flexDirection": "column" } }, "swiper-page": { "": { "flex": 1, "flexDirection": "column", "position": "absolute", "left": 0, "top": 0, "right": 0, "bottom": 0 } }, "@TRANSITION": { "scroll-view-animation": { "duration": 200, "property": "left" } } };
  var dom = weex.requireModule("dom");
  var MAX_CACHE_DATA = 100;
  var MAX_CACHE_PAGE = 3;
  var TAB_PRELOAD_OFFSET = 1;
  var _sfc_main = {
    components: {
      swiperPage
    },
    data() {
      return {
        tabList: [],
        tabIndex: 0,
        cacheTab: [],
        scrollInto: "",
        indicatorLineLeft: 0,
        indicatorLineWidth: 0,
        isTap: false,
        showTitleView: true,
        pageId: "page",
        refreshing: false,
        refreshText: "",
        refreshFlag: false
      };
    },
    onLoad() {
      for (var i = 0; i < 6; i++) {
        this.tabList.push({
          id: "tab" + i,
          name: "Tab " + (i + 1),
          pageid: i + 1
        });
      }
    },
    onReady() {
      this._lastTabIndex = 0;
      this.swiperWidth = 0;
      this.tabbarWidth = 0;
      this.tabListSize = {};
      this._touchTabIndex = 0;
      this.pageList = this.$refs.page;
      this.selectorQuery();
    },
    methods: {
      ontabtap(e) {
        let index = e.target.dataset.current || e.currentTarget.dataset.current;
        this.isTap = true;
        var currentSize = this.tabListSize[index];
        this.updateIndicator(currentSize.left, currentSize.width);
        this._touchTabIndex = index;
        this.switchTab(index);
      },
      onswiperchange(e) {
      },
      onswiperscroll(e) {
        if (this.isTap) {
          return;
        }
        var offsetX = e.detail.dx;
        var preloadIndex = this._lastTabIndex;
        if (offsetX > TAB_PRELOAD_OFFSET) {
          preloadIndex++;
        } else if (offsetX < -TAB_PRELOAD_OFFSET) {
          preloadIndex--;
        }
        if (preloadIndex === this._lastTabIndex || preloadIndex < 0 || preloadIndex > this.pageList.length - 1) {
          return;
        }
        if (this.pageList[preloadIndex].dataList.length === 0) {
          this.loadTabData(preloadIndex);
        }
        var percentage = Math.abs(this.swiperWidth / offsetX);
        var currentSize = this.tabListSize[this._lastTabIndex];
        var preloadSize = this.tabListSize[preloadIndex];
        var lineL = currentSize.left + (preloadSize.left - currentSize.left) / percentage;
        var lineW = currentSize.width + (preloadSize.width - currentSize.width) / percentage;
        this.updateIndicator(lineL, lineW);
      },
      animationfinish(e) {
        let index = e.detail.current;
        if (this._touchTabIndex === index) {
          this.isTap = false;
        }
        this._lastTabIndex = index;
        this.switchTab(index);
        this.updateIndicator(this.tabListSize[index].left, this.tabListSize[index].width);
      },
      selectorQuery() {
        uni.createSelectorQuery().in(this).select("#tab-bar").boundingClientRect().exec((rect) => {
          this.tabbarWidth = rect[0].width;
        });
        uni.createSelectorQuery().in(this).select("#tab-bar-view").boundingClientRect().exec((rect) => {
          this.swiperWidth = rect[0].width;
        });
        var queryTabSize = uni.createSelectorQuery().in(this);
        for (var i = 0; i < this.tabList.length; i++) {
          queryTabSize.select("#" + this.tabList[i].id).boundingClientRect();
        }
        queryTabSize.exec((rects) => {
          rects.forEach((rect) => {
            this.tabListSize[rect.dataset.id] = rect;
          });
          this.updateIndicator(this.tabListSize[this.tabIndex].left, this.tabListSize[this.tabIndex].width);
          this.switchTab(this.tabIndex);
        });
      },
      updateIndicator(left, width) {
        this.indicatorLineLeft = left;
        this.indicatorLineWidth = width;
      },
      switchTab(index) {
        if (this.pageList[index].dataList.length === 0) {
          this.loadTabData(index);
        }
        if (this.tabIndex === index) {
          return;
        }
        if (this.pageList[this.tabIndex].dataList.length > MAX_CACHE_DATA) {
          let isExist = this.cacheTab.indexOf(this.tabIndex);
          if (isExist < 0) {
            this.cacheTab.push(this.tabIndex);
          }
        }
        this.tabIndex = index;
        this.scrollTabTo(index);
        if (this.cacheTab.length > MAX_CACHE_PAGE) {
          let cacheIndex = this.cacheTab[0];
          this.clearTabData(cacheIndex);
          this.cacheTab.splice(0, 1);
        }
      },
      scrollTabTo(index) {
        const el = this.$refs["tabitem" + index][0];
        let offset = 0;
        if (index > 0) {
          offset = this.tabbarWidth / 2 - this.tabListSize[index].width / 2;
          if (this.tabListSize[index].right < this.tabbarWidth / 2) {
            offset = this.tabListSize[0].width;
          }
        }
        dom.scrollToElement(el, {
          offset: -offset
        });
      },
      loadTabData(index) {
        this.pageList[index].loadData();
      },
      clearTabData(index) {
        this.pageList[index].clear();
      },
      onrefresh(e) {
        this.refreshing = true;
        this.refreshText = "\u5237\u65B0\u4E2D...";
        setTimeout(() => {
          this.refreshing = false;
          this.refreshFlag = false;
          this.refreshText = "\u5DF2\u5237\u65B0";
        }, 2e3);
      },
      onpullingdown(e) {
        if (this.refreshing) {
          return;
        }
        this.pulling = false;
        if (Math.abs(e.pullingDistance) > Math.abs(e.viewHeight)) {
          this.refreshFlag = true;
          this.refreshText = "\u91CA\u653E\u7ACB\u5373\u5237\u65B0";
        } else {
          this.refreshFlag = false;
          this.refreshText = "\u4E0B\u62C9\u53EF\u4EE5\u5237\u65B0";
        }
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_swiper_page = (0, import_vue.resolveComponent)("swiper-page");
    const _component_swiper_item = (0, import_vue.resolveComponent)("swiper-item");
    const _component_swiper = (0, import_vue.resolveComponent)("swiper");
    return (0, import_vue.openBlock)(), (0, import_vue.createElementBlock)("scroll-view", {
      scrollY: true,
      showScrollbar: true,
      enableBackToTop: true,
      bubble: "true",
      style: { flexDirection: "column" }
    }, [
      (0, import_vue.createElementVNode)("view", { class: "tabs" }, [
        (0, import_vue.createElementVNode)("scroll-view", {
          ref: "tabbar1",
          id: "tab-bar",
          class: "tab-bar",
          scroll: false,
          scrollX: true,
          showScrollbar: false,
          scrollIntoView: $data.scrollInto
        }, [
          (0, import_vue.createElementVNode)("view", { style: { "flex-direction": "column" } }, [
            (0, import_vue.createElementVNode)("view", { style: { "flex-direction": "row" } }, [
              ((0, import_vue.openBlock)(true), (0, import_vue.createElementBlock)(
                import_vue.Fragment,
                null,
                (0, import_vue.renderList)($data.tabList, (tab, index) => {
                  return (0, import_vue.openBlock)(), (0, import_vue.createElementBlock)("view", {
                    class: "uni-tab-item",
                    key: tab.id,
                    id: tab.id,
                    ref_for: true,
                    ref: "tabitem" + index,
                    "data-id": index,
                    "data-current": index,
                    onClick: _cache[0] || (_cache[0] = (...args) => $options.ontabtap && $options.ontabtap(...args))
                  }, [
                    (0, import_vue.createElementVNode)(
                      "u-text",
                      {
                        class: (0, import_vue.normalizeClass)(["uni-tab-item-title", $data.tabIndex == index ? "uni-tab-item-title-active" : ""])
                      },
                      (0, import_vue.toDisplayString)(tab.name),
                      3
                      /* TEXT, CLASS */
                    )
                  ], 8, ["id", "data-id", "data-current"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]),
            (0, import_vue.createElementVNode)("view", { class: "scroll-view-indicator" }, [
              (0, import_vue.createElementVNode)(
                "view",
                {
                  ref: "underline",
                  class: (0, import_vue.normalizeClass)(["scroll-view-underline", $data.isTap ? "scroll-view-animation" : ""]),
                  style: (0, import_vue.normalizeStyle)({ left: $data.indicatorLineLeft + "px", width: $data.indicatorLineWidth + "px" })
                },
                null,
                6
                /* CLASS, STYLE */
              )
            ])
          ])
        ], 8, ["scrollIntoView"]),
        (0, import_vue.createElementVNode)("view", { class: "tab-bar-line" }),
        (0, import_vue.createVNode)(_component_swiper, {
          class: "tab-view",
          ref: "swiper1",
          id: "tab-bar-view",
          current: $data.tabIndex,
          duration: 300,
          onChange: $options.onswiperchange,
          onTransition: $options.onswiperscroll,
          onAnimationfinish: $options.animationfinish,
          onOnAnimationEnd: $options.animationfinish
        }, {
          default: (0, import_vue.withCtx)(() => [
            ((0, import_vue.openBlock)(true), (0, import_vue.createElementBlock)(
              import_vue.Fragment,
              null,
              (0, import_vue.renderList)($data.tabList, (page, index) => {
                return (0, import_vue.openBlock)(), (0, import_vue.createBlock)(
                  _component_swiper_item,
                  {
                    class: "swiper-item",
                    key: index
                  },
                  {
                    default: (0, import_vue.withCtx)(() => [
                      (0, import_vue.createVNode)(_component_swiper_page, {
                        class: "swiper-page",
                        pid: page.pageid,
                        ref_for: true,
                        ref: "page"
                      }, null, 8, ["pid"])
                    ]),
                    _: 2
                    /* DYNAMIC */
                  },
                  1024
                  /* DYNAMIC_SLOTS */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          _: 1
          /* STABLE */
        }, 8, ["current", "onChange", "onTransition", "onAnimationfinish", "onOnAnimationEnd"])
      ])
    ]);
  }
  var list = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["styles", [_style_0]], ["__file", "C:/Users/lu175/Desktop/\u5C0F\u7A0B\u5E8F/\u5C0F\u7070\u673A/pages/list/list.nvue"]]);

  // <stdin>
  var webview = plus.webview.currentWebview();
  if (webview) {
    const __pageId = parseInt(webview.id);
    const __pagePath = "pages/list/list";
    let __pageQuery = {};
    try {
      __pageQuery = JSON.parse(webview.__query__);
    } catch (e) {
    }
    list.mpType = "page";
    const app = Vue.createPageApp(list, { $store: getApp({ allowDefault: true }).$store, __pageId, __pagePath, __pageQuery });
    app.provide("__globalStyles", Vue.useCssStyles([...__uniConfig.styles, ...list.styles || []]));
    app.mount("#root");
  }
})();
