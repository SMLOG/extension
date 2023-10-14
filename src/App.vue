<template>
  <div
    id="app"
    ref="app"
    class="mytranslate-extension"
    :class="'fs-' + config.fs"
  >
    <div
      :class="{
        viewMode: config.viewMode || wlargeh,
        touchstart: config2.touchstart,
        showList: config2.showList,
        showCustCue: config.custCue,
        cueTop:config.custCue==2,
        cueBotton:config.custCue==1,
        wlargeh: wlargeh,
      }"
    >
      <div
        v-if="showApp || showSidebar || config2.mask"
        class="vt-backdrop backdrop"
         style="
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: rgba(255, 255, 255, 0.1);
          transition: opacity 0.5s;
          z-index: 11110;
        "
        @click.stop="touchMask()"
        @mouseup.stop
        @touchend.stop
      ></div>
      <div class="loading" v-if="loading">
        <font-awesome-icon icon="fa-solid fa-spinner" />
      </div>
      <div style="width:100%;height: 100%;">
        <div v-if="curPlay" class="curPlay">
          <div @click="toggleAutoPlay()">
            {{ curPlay.q }} <b v-if="curPlay.am"> [{{ curPlay.am }}]</b>
            <div>{{ curPlay.to }}</div>
          </div>
        </div>

        <MediaPlayer />
        <news2 v-if="shownews" />
        <cur-words />
      </div>
      <div class="sidebarsetting" :class="{ open: showSidebar }">
        <div
          class="container"
          style="
            margin: 5px;
            user-select: none;
            display: flex;
            justify-content: space-between;
            line-height: 2em;
          "
        >
          <a
            class="barTitle"
            style="font-weight: bold; font-size: 1.5em"
            @click="toggleSetting"
            ><span style="color: blue">abc</span
            ><span style="color: red">Wo</span></a
          >
          <div class="content">
            <span class="ver"> {{ ver }}</span>
          </div>
        </div>
        <Setting style="background-color: gray" />
        <div v-if="error" class="error">
          <div>{{ error }}</div>
          <div>
            <a target="_blank" :href="errorUrl">{{ errorUrl }}</a>
          </div>
        </div>
      </div>
      <div id="root_1" ref="root" :style="{ zIndex: zIndex }" v-show="showApp">
        <div id="nav" ref="rootnav">
          <div style="display: inline-block">
            <input
              type="checkbox"
              value="true"
              :checked="curItem.n"
              @mouseup.stop=""
              @change="changeItemNew($event)"
            />

            <span ref="play" :class="{ active: curTab == 'HelloWorld' }">
              Play
            </span>
            ↔
            <span
              @click="setCurTab('HelloWorld')"
              @mouseenter="enterTab($event, 'HelloWorld')"
              :class="{ active: curTab == 'HelloWorld' }"
              >Detail</span
            >
            |
            <span
              @click="setCurTab('NewWordsR')"
              @mouseenter="enterTab($event, 'NewWordsR')"
              :class="{ active: curTab == 'NewWordsR' }"
              >Word</span
            >

            |

            <span v-if="error" @click="showError()" style="color: red"
              >Error</span
            >
          </div>
          <input
            type="checkbox"
            value="true"
            :checked="curItem.n"
            @mouseup.stop=""
            @change="changeItemNew($event)"
            style="position: absolute; right: 3px"
          />
        </div>
        <div>
          <keep-alive>
            <component
              :key="curTab"
              v-bind:is="curTab"
              v-bind:play="'$refs.play'"
            ></component>
          </keep-alive>
        </div>
      </div>
    </div>
    <top-tool />
  </div>
</template>
<script>
import { mapState } from "vuex";
import HelloWorld from "./components/HelloWorld.vue";
import NewWordsR from "./components/NewWordsR.vue";
import MediaPlayer from "./components/MediaPlayer.vue";
import News from "./components/News.vue";
import News2 from "./components/News2.vue";
import CurWords from "./components/CurWords.vue";
import TopTool from "./components/TopTool.vue";
import Setting from "./components/Setting.vue";
//import Clip from "./components/Clip.vue";
import  './base.css'

import bus from "./bus";
import $ from "jquery";
import { service, GetSelectedText } from "@/service";
import { version } from "@/version";
import { bgsound } from "@/lib";

export default {
  data() {
    return {
      ver: version,
      zIndex: new Date().getTime(),
      error: "",
      errorUrl: "",
      showTimer: false,
      pauseTimer: 0,
      pauseTimerTimer: 0,
      endTime: "",
      showInputToken: 0,
      token: "",
      tokenMessage: "",
      wlargeh: 0,
    };
  },
  filters: {
    fmtDate(date) {
      if (date) {
        return (
          date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
        );
      }
      return "";
    },
  },
  components: {
    HelloWorld,
    NewWordsR,
    MediaPlayer,
    Setting,
    News,
    News2,
    CurWords,
    TopTool,
  },
  mounted() {
    const documentHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty("--doc-height", `${window.innerHeight}px`);
      this.wlargeh = window.innerWidth > window.innerHeight;
    };
    window.addEventListener("resize", documentHeight);
    documentHeight();

    bus.root = this.$refs.root;
    $(this.$refs.rootnav).on("click", () => {
      this.clearSelect();
    });
    let doc = document;
    let startX, endX;
    //touchStart事件
    doc.addEventListener(
      "touchstart",
      function (event) {
        if (event.targetTouches.length == 1) {
          var touch = event.targetTouches[0];
          endX = startX = touch.pageX;
        }
      },
      false
    );
    doc.addEventListener(
      "touchmove",
      function (event) {
        if (event.targetTouches.length == 1) {
          var touch = event.targetTouches[0];
          endX = touch.pageX;
        }
      },
      false
    );

    doc.addEventListener(
      "touchend",
      function (event) {
        if (Math.abs(endX - startX) > 140) {
          let select = GetSelectedText().toString();
          if (select.length == 0) bus.$emit("swiper", event, endX - startX);
        }
      },
      false
    );

    let triggerAudioContext = 0;
    let clickHandler = (e) => {
      if (this.$refs.root && this.showApp) {
        if (!this.$refs.root.contains(e.target)) {
          this.$store.commit("setShowApp", false);
        }
      }
      if (!triggerAudioContext) {
        triggerAudioContext = 1;
        bgsound();
      }
    };

    doc.addEventListener("click", clickHandler);
    doc.addEventListener("touchend", clickHandler);

    bus.$on("click", clickHandler);
    this.$refs.play.addEventListener("mouseenter", (event) => {
      this.setCurTab("HelloWorld");
      console.log(event);
      bus.$emit("play", event);
    });
    bus.$on("error", (resp) => {
      this.error = resp.error;
      this.errorUrl = resp.errorUrl;
    });
  },
  methods: {
    touchMask() {
      this.$store.commit("setShowSetting", 0);
      this.$store.commit("setShowApp", 0);
      this.updateConfig2({mask:0})

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
    toggleAutoPlay() {
      bus.$emit("toggleAutoPlay");
    },

    showError() {
      alert(this.error + ":" + this.errorUrl);
    },
    changeItemNew(event) {
      if (this.curItem.q.trim()) {
        this.curItem.n = event.target.checked ? 1 : 0;
        service(null, { cmd: "newWord", content: this.curItem }, (resp) => {
          // this.$store.commit("setCurItem", resp.contents);
          this.$store.commit("newWord", resp.contents);
        });
      }
    },

    setCurTab(tab) {
      this.$store.commit("setCurTab", tab);
    },
    enterTab(event, tab) {
      let timer;
      let outHander = function () {
        clearTimeout(timer);
        event.target.removeEventListener("mouseout", outHander);
      };
      event.target.addEventListener("mouseout", outHander);
      timer = setTimeout(() => {
        this.setCurTab(tab);
      }, 200);
    },
    submitToken() {
      this.tokenMessage = "";
      service(null, { cmd: "token", content: this.token }, (resp) => {
        this.tokenMessage = resp.message || resp.name;
      });
    },
  },

  computed: {
    ...mapState([
      "curTab",
      "showApp",
      "curItem",
      "curPlay",
      "loading",
      "showSidebar",
    ]),
  },
  watch: {
    showApp(n) {
      if (n) {
        this.zIndex = new Date().getTime();
      }
    },

    pauseTimer(i) {
      clearTimeout(this.pauseTimerTimer);
      console.log("pause");
      let self = this;
      let n = parseInt(i);
      if (n > 0) {
        let start = new Date().getTime();
        self.endTime = new Date(start + n * 60 * 1000);

        this.pauseTimerTimer = setTimeout(() => {
          $("audio,video").each(function () {
            $(this)[0].pause();
          });
          service(null, { cmd: "audio", pause: true }, function () {
            console.log("audio pause");
          });
          self.pauseTimer = 0;
          self.endTime = "";
        }, n * 60 * 1000);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
#app {
  all: initial; /* blocking inheritance for all properties */
}
#root_1 {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
  position: absolute;
  top: 70px;
  right: 0;
  z-index: 100000;
  max-width: 500px;
  padding: 2px;
  background: gray;
  max-width: 400px;
  max-height: calc(100vh - 70px);
  overflow: auto;
}

@media (max-width: 420px) {
  #root_1 {
    width: calc(100% - 3px);
  }
}

#root_1 #nav {
  padding: 5px;
  text-align: left;
  position: relative;
  padding-right: 25px;
  user-select: none;
  span {
    font-weight: bold;
    color: #2c3e50;
    cursor: pointer;
    display: inline-block;
    margin: 3px;

    &.active {
      color: #42b983;
    }
  }
}
.error {
  text-align: left;
  color: red;
}

.curPlay {
  position: fixed;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: green;
  padding: 10px;
  top: 0;
  z-index: 100000;
}
</style>
<style scoped>
#root_1 >>> input,
#root_1 >>> select {
  color: black !important;
}
.curPlay,
#root_1 {
  font-size: 1.4em;
}
.sidebarsetting {
  position: fixed;
  max-width: 350px;
  top: 0;
  bottom: 0;
  background: gray;
  left: 0;
  min-width: 300px;
  opacity: 0;
  overflow-x: hidden;
  overflow-y: auto;
  transform: translate(-100%);
  transition: background-color 0.5s, opacity 0.5s, transform 0.3s ease;
  z-index: 11111;
}
.sidebarsetting.open {
  opacity: 1;
  visibility: visible;
  transform: translate(0) !important;
  transition: background-color 0.5s, opacity 0.25s,
    transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}
.viewMode.wlargeh {
  transform: none;
  height: var(--doc-height);
  width: 100vw;
  margin-top: 0;
}
.viewMode {
  position: absolute;
  transform: rotate(90deg);
  transform-origin: bottom left;
  width: 100vh;
  width: var(--doc-height);
  /* width: min(calc(16 / 9 * 100vw), 100vh); */
  height: 100vw;
  margin-top: -100vw;
  -o-object-fit: cover;
  object-fit: cover;
  z-index: 4;
  visibility: visible;
  z-index: 100000;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.viewMode .text {
  display: none;
}

.showCustCue >>>  .vjs-text-track-display,.showCustCue >>> video::cue {
  display: none;
  font-size: 0;
}



.fs-1 >>> .custCue,.fs-1 >>>.text,.fs-1 >>> .vjs-text-track-cue,.fs-1 >>> video::-webkit-media-text-track-display  {
  font-size: 1em !important;
}

.fs-2 >>> .custCue
,.fs-2 >>>.text,
.fs-2 >>> .vjs-text-track-cue 
,.fs-2 >>> video::-webkit-media-text-track-display {
  font-size: 1.5em !important;
}

.fs-3 >>> .custCue,.fs-3 >>>.text,.fs-3 >>> .vjs-text-track-cue  ,.fs-3 >>> video::-webkit-media-text-track-display{
  font-size: 2em !important;
}

.fs-4 >>> .custCue,.fs-4 >>>.text,.fs-4 >>> .vjs-text-track-cue ,.fs-4 >>> video::-webkit-media-text-track-display  {
  font-size: 2.25em !important;
}


.fs-5 >>> .custCue,.fs-5 >>>.text,.fs-5 >>> .vjs-text-track-cue,.fs-5 >>> video::-webkit-media-text-track-display {
  font-size: 2.5em !important;
}
 .custCue >>> video::cue {
  visibility: hidden;
}

 .viewMode >>> pbtn {
  visibility: hidden;
}
</style>
