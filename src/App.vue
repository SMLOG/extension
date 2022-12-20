<template>
  <div id="app" ref="app" class="mytranslate-extension">
    <div class="loading" v-if="loading">
      <font-awesome-icon icon="fa-solid fa-spinner" />
    </div>
    <div>
      <div v-if="curPlay" class="curPlay">
        <div @click="toggleAutoPlay()">
          {{ curPlay.q }} <b v-if="curPlay.am"> [{{ curPlay.am }}]</b>
          <div>{{ curPlay.to }}</div>
        </div>
      </div>

      <MediaPlayer />
      <news2 v-if="news" />
      <cur-words />
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

      <Setting style="background-color: gray" />
      <div v-if="error" class="error">
        <div>{{ error }}</div>
        <div>
          <a target="_blank" :href="errorUrl">{{ errorUrl }}</a>
        </div>
      </div>
    </div>
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
import Setting from "./components/Setting.vue";

import bus from "./bus";
import $ from "jquery";
import { service, GetSelectedText } from "@/service";

import { bgsound } from "@/lib";
export default {
  data() {
    return {
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
  },
  mounted() {
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

    service(null, { cmd: "getConfig" }, (resp) => {
      this.$store.commit("config", resp);
    });
  },
  methods: {
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
    ...mapState(["curTab", "showApp", "curItem", "curPlay", "loading"]),
    news() {
      return this.$store.state.config.news;
    },
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
  text-align: center;
  color: #2c3e50;
  position: absolute;
  top: 70px;
  right: 0;
  z-index: 100000;
  max-width: 500px;
  padding: 2px;
  background: gray;
  max-width: 100%;
  max-height: calc(100vh - 70px);
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
</style>
