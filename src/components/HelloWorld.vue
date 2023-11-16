<template>
  <div ref="hello" style="padding: 5px; background: white">
    <div class="wrap">
      <div class="row">
        {{ curItem.q }}
        <b v-if="curItem.am"> [{{ curItem.am }}]</b>
        <b v-if="curItem.en != curItem.am"> [{{ curItem.en }}]</b>
        <span v-if="false" class="src" @click="goto('G', curItem)">G</span>
      </div>

      <div class="row" v-if="false" style="font-weight: bold">
        {{ curItem.to }}
      </div>
      <div v-for="to in _toList" :key="to.src" class="row">
        <span
          @click.prevent="selectItem(to)"
          :class="{ cur: to.to == curItem.to }"
          class="to"
          >{{ to.to }}</span
        >
        <span class="src" @click="playSound(to, 1, to.src)">{{ to.src }}</span>
      </div>
      <div class="row" v-if="curItem.error">{{ curItem.error }}</div>
      <div class="row" v-if="curItem.errorUrl">
        <a target="_blank" :href="curItem.errorUrl">{{ curItem.errorUrl }}</a>
      </div>
    </div>
  </div>
</template>

<script>
var timer;
import { mapState } from "vuex";
import $ from "jquery";
import bus from "@/bus";
import { service, transHtml, GetSelectedText } from "@/service";
window.notinchromeextend = true;
window.$ = $;
let isMobile = navigator.userAgent.match(
  /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
);

export default {
  data() {
    return { list: [] };
  },
  created() {},
  methods: {
    selectItem(item) {
      this.curItem.to = item.to;
      this.curItem.n = !this.curItem.n;
      this.$store.commit("setCurItem", this.curItem);

      service(null, { cmd: "newWord", content: this.curItem }, (resp) => {
        // this.$store.commit("setCurItem", resp.contents);
        if (resp) {
          this.$store.commit("newWord", resp.contents);
        }
      });
    },
    updateItem() {
      this.curItem.n = !this.curItem.n;
      this.changeItemNew(this.curItem);
    },
    sendMessage(tab, params, resp) {
      service(tab, params, resp);
    },
    updatePos() {
      let root = $(bus.root);

      try {
        var r = window.getSelection
          ? window.getSelection().getRangeAt(0)
          : document.selection && document.selection.createRange();
        var s = r.getBoundingClientRect();
        var left = isMobile
          ? 0
          : (s.left + s.right) / 2 + $(window).scrollLeft() - 20;
        let top = s.bottom + $(window).scrollTop() + 8;
        root.css({
          position: "absolute",
          top: 0,
          left: 0,
          right: "auto",
        });

        console.log("error....");
        setTimeout(() => {
          console.log(
            root.offset().left + root.outerWidth(),
            $(window).width()
          );
          let reachRight =
            left + root.offset().left + root.outerWidth() >= $(window).width();
          //let reachBottom =
          //   root.offset().top + root.outerHeight() >= $(window).height();
          let reachBottom =
            top + root.offset().top + root.outerHeight() >=
            $(window).height() + $(window).scrollTop();
          if (reachRight || reachBottom) {
            top = reachBottom
              ? $(window).height() + $(window).scrollTop() - root.outerHeight()
              : top;
            root.css({
              top: top,
              left: reachRight ? "auto" : left,
              right: reachRight ? 0 : "auto",
            });
          } else {
            root.css({
              position: "absolute",
              top: top,
              left: left,
              right: "auto",
            });
          }
          if (this.config.viewMode) {
            root.css({ top: 0 });
          }
        }, 100);
      } catch (ee) {
        root.css({
          position: "fixed",
          top: 0,
          left: 0,
          right: "auto",
        });
      }
      console.log("viewmod");
      if (this.config.viewMode) {
        root.css({ top: 0 });
      }
      //this.clearSelect();
    },
    clearSelect() {
      if (window.getSelection) {
        if (window.getSelection().empty) {
          // Chrome
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
          // Firefox
          window.getSelection().removeAllRanges();
        }
      } else if (document.selection) {
        // IE?
        document.selection.empty();
      }
    },
    playSound(item, wait, speeker) {
      let self = this;
      return new Promise((resolve) => {
        clearTimeout(timer);
        if (!self.autoSound) resolve();
        else
          timer = setTimeout(() => {
            this.sendMessage(
              null,
              { cmd: "audio", content: item.q, wait: wait, speeker: speeker },
              function (response) {
                console.log(response);
                if (response) resolve();
              }
            );
          }, 100);
      });
    },
    onEnterPlay(event, item) {
      (async () => {
        var self = this;
        var stop = false;
        if (!event) return;
        let target = event.target;
        let handle = function () {
          stop = true;
          target && event.target.removeEventListener("mouseout", handle);
        };

        target && event.target.addEventListener("mouseout", handle);
        for (let i = 0; i < 100; i++) {
          console.log(stop);
          console.log(stop);
          if (stop) return;
          console.log(stop);

          await self.playSound(item, true);
        }
      })();
    },
    goto(src, item) {
      let url;
      let en = encodeURIComponent(item.q);
      if (src == "G") {
        (url = `https://translate.google.cn/?sl=en&tl=zh-CN&text=${en}&op=translate`),
          "google";
      } else if (src == "BD") {
        url = `https://fanyi.baidu.com/#/en/zh/${en}`;
      } else {
        url = `http://www.iciba.com/word?w=${en}`;
      }
      window.open(url);
    },
    getExist(text) {
      let words = this.words;
      let q = text.toLowerCase().trim();
      for (let j = 0; j < words.length; j++) {
        if (words[j].q == q) {
          return words[j];
        }
      }
      return { n: false };
    },
    tran() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        var text = GetSelectedText()
          .toString()
          .replace(/[\r\n]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (!text || text.length == 0 || text.length > this.config.maxTranLen)
          return;
        let chars = text.match(/[a-z]/gi);
        if (!chars || /[\u4e00-\u9fa5]/.test(text) || /\//.test(text)) return;

        if (text.length > 500) {
          text = text.substring(0, 500);
        }

        this.$store.commit("setShowApp", true);
        // this.updatePos();
        var vue = this;

        var item = this.getExist(text);

        item = Object.assign(
          {
            q: text,
            dt: new Date().getTime(),
            am: "",
            en: "",
            to: "",
            _toList: [],
            errorUrl: "",
          },
          this.getExist(text)
        );

        this.$store.commit("setCurTab", "HelloWorld");
        this.$store.commit("setCurItem", item);
        if (chars.length > 1) {
          this.sendMessage(
            null,
            { cmd: "translate", content: item, config: vue.config },
            function (response) {
              console.log(response);

              if (response) {
                if (!item.to && response.length > 0) {
                  let _toList = response.filter((e) => e.to != undefined);
                  item.to = _toList.length > 0 ? _toList[0].to : "";
                }
                if (!item.en && response.length > 0) {
                  let _toList = response.filter((e) => e.en != undefined);
                  item.en = _toList.length > 0 ? _toList[0].en : "";
                  item.am = _toList.length > 0 ? _toList[0].am : "";
                }

                item._toList = response;

                console.log(response);
                vue.$store.commit("setCurItem", item);
                console.log(item);
              }
            }
          );
          console.log("play sound");
          vue.playSound(item);
        }
      }, 500);
    },
  },
  mounted() {
    let self = this;
    // $(document).on("click", ".newWord", function () {
    // self.playSound({ q: $(".newWorda", this).text() });
    // });

    $(document).on(isMobile ? "click" : "mouseenter", ".newWord", function () {
      self.playSound({ q: $(".newWorda", this).text() });
    });

    $(document).on("click", ".newWord", function () {
      $(this).find(".newWordb").toggle();
    });

    transHtml();

    document.addEventListener("keydown", (event) => {
      console.log(event);
      if (event.key == "Control") {
        if ($("html > head #newwordHl").length > 0) {
          $("html > head #newwordHl").remove();
        } else {
          $("html > head").append(
            $(`<style id="newwordHl" type = "text/css">
      .newWordb{   display:none;}
      </style>`)
          );
        }

        //  this.tran();
      }
    });

    if (isMobile) {
      let t = 0;
      $(document).on("click", function () {
        if (new Date().getTime() - t < 300) {
          if ($("html > head #newwordHl").length > 0) {
            $("html > head #newwordHl").remove();
          } else {
            $("html > head").append(
              $(`<style id="newwordHl" type = "text/css">
      .newWordb{   display:none;}
      </style>`)
            );
          }
        }
        t = new Date().getTime();
      });
    }

    document.addEventListener("mouseup", () => {
      setTimeout(() => {
        if (this.config.activeTran) this.tran();
      }, 10);
    });
    document.addEventListener("touchend", () => {
      this.tran();
    });

    bus.$on("play", (event) => {
      console.log(event);
      this.onEnterPlay(event, this.curItem);
    });

    let lastTime = 0;
    document.addEventListener("keyup", (event) => {
      console.log(event);
      if (event.key == "Control") {
        if (new Date().getTime() - lastTime < 500) {
          this.$store.commit(
            "config",
            Object.assign({}, this.config, {
              activeTran: !this.config.activeTran,
            })
          );
        }
        lastTime = new Date().getTime();
      } else {
        lastTime = 0;
      }
    });
  },
  computed: {
    ...mapState(["curItem", "words", "showApp"]),
    autoSound() {
      return this.$store.state.config.autoSound;
    },
    defaultText() {
      return browser.i18n.getMessage("extName");
    },
    _toList() {
      return this.curItem._toList && this.curItem._toList.filter
        ? this.curItem._toList.filter((e) => e.to)
        : [];
    },
  },
  watch: {
    showApp() {
      this.updatePos();
    },
  },
};
</script>

<style scoped>
p {
  font-size: 20px;
}
table tr:nth-child(odd) {
  background-color: #f5f5f5;
}
table tr:nth-child(even) {
  background-color: #fff;
}
.floatTop2 {
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  background: gray;
  padding: 1px;
  color: white;
  padding-left: 3px;
}
.newword {
  width: 4em;
  /* font-size: 80%; */
  vertical-align: top;
}
.src {
  color: gray;
  font-size: 0.8em;
  flex-grow: 0;
  margin-left: 5px;
  cursor: pointer;
  right: 0;
  user-select: none;
}
.row {
  position: relative;
  text-align: left;
  margin: 0 !important;
  position: relative;
  display: flex;
  justify-content: space-between;
}
.wrap .row:nth-child(even) {
  background-color: #f4f4f4;
}
b {
  font-weight: bold;
}
.cur {
  font-weight: bold;
}
.to {
  cursor: pointer;
  width: 100%;
  display: inline-block;
}
</style>
