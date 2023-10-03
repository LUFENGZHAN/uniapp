import { openBlock, createElementBlock, createElementVNode, toDisplayString, Fragment, renderList, resolveComponent, normalizeClass, normalizeStyle, createVNode, withCtx, createBlock } from "vue";
function formatAppLog(type, filename, ...args) {
  if (uni.__log__) {
    uni.__log__(type, filename, ...args);
  } else {
    console[type].apply(console, [...args, filename]);
  }
}
const _style_0$1 = { "refresh-view": { "": { "width": "750rpx", "height": 80, "flexDirection": "row", "alignItems": "center", "justifyContent": "center" } }, "list": { "": { "flex": 1, "backgroundColor": "#ebebeb" } }, "list-item": { "": { "marginLeft": 12, "marginRight": 12, "marginTop": 12, "paddingTop": 20, "paddingRight": 20, "paddingBottom": 20, "paddingLeft": 20, "backgroundColor": "#ffffff", "borderRadius": 5 } } };
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$1 = {
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
      this.refreshText = "刷新中...";
      setTimeout(() => {
        this.refreshing = false;
        this.refreshFlag = false;
        this.refreshText = "已刷新";
      }, 2e3);
    },
    onpullingdown(e) {
      if (this.refreshing) {
        return;
      }
      this.pulling = false;
      if (Math.abs(e.pullingDistance) > Math.abs(e.viewHeight)) {
        this.refreshFlag = true;
        this.refreshText = "释放立即刷新";
      } else {
        this.refreshFlag = false;
        this.refreshText = "下拉可以刷新";
      }
    }
  }
};
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("list", {
    class: "list",
    offsetAccuracy: 6,
    bounce: true,
    isSwiperList: "true"
  }, [
    createElementVNode("refresh", {
      class: "refresh",
      onRefresh: _cache[0] || (_cache[0] = (...args) => $options.onrefresh && $options.onrefresh(...args)),
      onPullingdown: _cache[1] || (_cache[1] = (...args) => $options.onpullingdown && $options.onpullingdown(...args)),
      display: $data.refreshing ? "show" : "hide"
    }, [
      createElementVNode("div", { class: "refresh-view" }, [
        createElementVNode(
          "u-text",
          { class: "loading-text" },
          toDisplayString($data.refreshText),
          1
          /* TEXT */
        )
      ])
    ], 40, ["display"]),
    (openBlock(true), createElementBlock(
      Fragment,
      null,
      renderList($data.dataList, (item, index) => {
        return openBlock(), createElementBlock("cell", {
          key: item.id,
          onClick: _cache[2] || (_cache[2] = (...args) => $options.onclick && $options.onclick(...args))
        }, [
          createElementVNode("view", { class: "list-item" }, [
            createElementVNode(
              "u-text",
              null,
              toDisplayString(item.name),
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
const swiperPage = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["styles", [_style_0$1]], ["__file", "C:/Users/lu175/Desktop/小程序/小灰机/pages/list/nvue-swiper-page.nvue"]]);
const _style_0 = { "page": { "": { "flex": 1 } }, "flexible-view": { "": { "backgroundColor": "#f823ff" } }, "tabs": { "": { "flex": 1, "flexDirection": "column", "overflow": "hidden", "backgroundColor": "#ffffff" } }, "tab-bar": { "": { "width": "750rpx", "height": "84rpx", "flexDirection": "row" } }, "scroll-view-indicator": { "": { "position": "relative", "height": 2, "backgroundColor": "rgba(0,0,0,0)" } }, "scroll-view-underline": { "": { "position": "absolute", "top": 0, "bottom": 0, "width": 0, "backgroundColor": "#007AFF" } }, "scroll-view-animation": { "": { "transitionDuration": 200, "transitionProperty": "left" } }, "tab-bar-line": { "": { "height": "1rpx", "backgroundColor": "#cccccc" } }, "tab-view": { "": { "flex": 1 } }, "uni-tab-item": { "": { "flexWrap": "nowrap", "paddingLeft": 25, "paddingRight": 25 } }, "uni-tab-item-title": { "": { "color": "#555555", "fontSize": "30rpx", "height": "80rpx", "lineHeight": "80rpx", "flexWrap": "nowrap" } }, "uni-tab-item-title-active": { "": { "color": "#007AFF" } }, "swiper-item": { "": { "flex": 1, "flexDirection": "column" } }, "swiper-page": { "": { "flex": 1, "flexDirection": "column", "position": "absolute", "left": 0, "top": 0, "right": 0, "bottom": 0 } }, "@TRANSITION": { "scroll-view-animation": { "duration": 200, "property": "left" } } };
const dom = weex.requireModule("dom");
const MAX_CACHE_DATA = 100;
const MAX_CACHE_PAGE = 3;
const TAB_PRELOAD_OFFSET = 1;
const _sfc_main = {
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
      this.refreshText = "刷新中...";
      setTimeout(() => {
        this.refreshing = false;
        this.refreshFlag = false;
        this.refreshText = "已刷新";
      }, 2e3);
    },
    onpullingdown(e) {
      if (this.refreshing) {
        return;
      }
      this.pulling = false;
      if (Math.abs(e.pullingDistance) > Math.abs(e.viewHeight)) {
        this.refreshFlag = true;
        this.refreshText = "释放立即刷新";
      } else {
        this.refreshFlag = false;
        this.refreshText = "下拉可以刷新";
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_swiper_page = resolveComponent("swiper-page");
  const _component_swiper_item = resolveComponent("swiper-item");
  const _component_swiper = resolveComponent("swiper");
  return openBlock(), createElementBlock("scroll-view", {
    scrollY: true,
    showScrollbar: true,
    enableBackToTop: true,
    bubble: "true",
    style: { flexDirection: "column" }
  }, [
    createElementVNode("view", { class: "tabs" }, [
      createElementVNode("scroll-view", {
        ref: "tabbar1",
        id: "tab-bar",
        class: "tab-bar",
        scroll: false,
        scrollX: true,
        showScrollbar: false,
        scrollIntoView: $data.scrollInto
      }, [
        createElementVNode("view", { style: { "flex-direction": "column" } }, [
          createElementVNode("view", { style: { "flex-direction": "row" } }, [
            (openBlock(true), createElementBlock(
              Fragment,
              null,
              renderList($data.tabList, (tab, index) => {
                return openBlock(), createElementBlock("view", {
                  class: "uni-tab-item",
                  key: tab.id,
                  id: tab.id,
                  ref_for: true,
                  ref: "tabitem" + index,
                  "data-id": index,
                  "data-current": index,
                  onClick: _cache[0] || (_cache[0] = (...args) => $options.ontabtap && $options.ontabtap(...args))
                }, [
                  createElementVNode(
                    "u-text",
                    {
                      class: normalizeClass(["uni-tab-item-title", $data.tabIndex == index ? "uni-tab-item-title-active" : ""])
                    },
                    toDisplayString(tab.name),
                    3
                    /* TEXT, CLASS */
                  )
                ], 8, ["id", "data-id", "data-current"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          createElementVNode("view", { class: "scroll-view-indicator" }, [
            createElementVNode(
              "view",
              {
                ref: "underline",
                class: normalizeClass(["scroll-view-underline", $data.isTap ? "scroll-view-animation" : ""]),
                style: normalizeStyle({ left: $data.indicatorLineLeft + "px", width: $data.indicatorLineWidth + "px" })
              },
              null,
              6
              /* CLASS, STYLE */
            )
          ])
        ])
      ], 8, ["scrollIntoView"]),
      createElementVNode("view", { class: "tab-bar-line" }),
      createVNode(_component_swiper, {
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
        default: withCtx(() => [
          (openBlock(true), createElementBlock(
            Fragment,
            null,
            renderList($data.tabList, (page, index) => {
              return openBlock(), createBlock(
                _component_swiper_item,
                {
                  class: "swiper-item",
                  key: index
                },
                {
                  default: withCtx(() => [
                    createVNode(_component_swiper_page, {
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
const list = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["styles", [_style_0]], ["__file", "C:/Users/lu175/Desktop/小程序/小灰机/pages/list/list.nvue"]]);
export {
  list as default
};
