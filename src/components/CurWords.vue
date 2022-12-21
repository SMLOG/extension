<template>
  <div>
    <div
      class="op_tool"
      @touchstart="onTouch()"
      :style="{ opacity: opacity, fontSize: opacity == 1 ? '150%' : '50%' }"
      @mouseenter="onTouch()"
      @mouseleave="onLeave()"
      @touchmove="onTouch()"
      @touchend="onLeave"
      ref="op_tool"
    >
      <div
        ref="mask"
        style="
          width: 150%;
          height: 100%;
          position: absolute;
          z-index: 1;
          user-select: none;
        "
        v-show="opacity < 1"
      ></div>
      <span @click="togglePlayAndMode()" :class="{ playing: playing }">{{
        playMode
      }}</span>
      <font-awesome-icon
        icon="volume-high"
        fixed-width
        v-show="showCurWords && playing"
        @click="playing = !playing"
        size="lg"
      ></font-awesome-icon>
      <font-awesome-icon
        @click="playing = !playing"
        icon="volume-xmark"
        fixed-width
        v-show="showCurWords && !playing"
        size="lg"
      ></font-awesome-icon>
      <font-awesome-icon
        @click="setShowCurWords(!showCurWords)"
        icon="arrow-circle-left"
        fixed-width
        v-show="!showCurWords"
        size="lg"
      />
      <font-awesome-icon
        @click="setShowCurWords(!showCurWords)"
        icon="arrow-circle-right"
        fixed-width
        v-show="showCurWords"
        size="lg"
      />

      <font-awesome-icon @click="showApp()" icon="eye" fixed-width size="lg" />
    </div>

    <div class="curWs" ref="curWs">
      <WordItem
        v-show="showCurWords"
        v-for="w in curWords"
        :key="w.q"
        :curPlay="curPlay"
        style="padding: 5px 0"
        :word="w"
        ref="word"
        :playMode="playMode"
        :playing="playing"
        :playRel="1"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import bus from "@/bus";
import $ from "jquery";
import WordItem from "./WordItem.vue";

export default {
  data() {
    return {
      playMode: (localStorage.playMode && parseInt(localStorage.playMode)) || 0,
      playing: 0,
      curPlay: "",
      isSpell: false,
      playNum: 0,
      toucherTimer: 0,
      opacity: 0.1,
    };
  },
  created() {},
  computed: {
    ...mapState(["curWords", "showCurWords"]),
  },
  components: {
    WordItem,
  },
  methods: {
    onLeave() {
      this.toucherTimer = setTimeout(() => {
        this.opacity = 0.1;
      }, 3000);
    },
    onTouch() {
      clearTimeout(this.toucherTimer);
      this.opacity = 1;
    },
    togglePlayAndMode() {
      this.playMode++;
      if (this.playMode > 3) this.playMode = 0;
      localStorage.playMode = this.playMode;
    },
    setShowCurWords(b) {
      this.$store.commit("setShowCurWords", b);
      if (!b) this.playing = 0;
    },
    showApp() {
      console.log("error");
      setTimeout(() => {
        this.$store.commit("setShowApp", true);
      }, 500);
    },

    async playList() {
      let pageList = this.curWords;

      if (pageList.length)
        for (let d = 0; d < this.$refs.word.length; d++) {
          if (!this.playing) {
            this.curPlay = "";
            return;
          }

          console.log(pageList[d].q, pageList[d], this.$refs.word[d]);

          //await this.playSound(pageList[d], true);
          await this.sleep(10);
          await this.$refs.word[d].playWords(this.$refs.curWs);
        }

      this.playing = 0;
    },
    showHideCurWords(show) {
      let ww = $(window).width();
      if ($(".videoCon").is(":visible")) {
        let vw = $(".videoCon").width();
        let dockside = vw > 0 && ww - vw < ww * 0.25;

        $(this.$refs.curWs).css(
          "top",
          dockside ? $(".text").offset().top + "px" : "auto"
        );
        if (show) {
          if (dockside) {
            $(".text").css({
              width: ww != vw ? Math.min(ww * 0.75, vw) + "px" : "75%",
            });
            $(this.$refs.curWs).css({
              left: "auto",
              right: "0",
            });
          } else
            $(this.$refs.curWs).css({
              left: $(".text").outerWidth() + "px",
              right: "auto",
            });
        } else {
          $(".text").css("width", "100%");
        }
      } else {
        if (show) {
          $(this.$refs.curWs).css({
            left: "auto",
            right: "0",
            top: 0,
          });
          $(".new2").css("width", "75%");
        } else {
          $(".new2").css("width", "100%");
        }
      }
    },
  },
  mounted() {
    $(window).resize(() => {
      this.showHideCurWords(this.showCurWords);
    });
    let clickHandler = (e) => {
      if (this.$refs.op_tool) {
        if (!this.$refs.op_tool.contains(e.target)) {
          this.opacity = 0.1;
        }
      }
    };
    document.addEventListener("click", clickHandler);

    bus.$on("newWord", (item) => {
      this.$store.commit("add2CurWords", [[item]]);
    });
    bus.$on("playCurWords", () => {
      (async () => {
        try {
          this.skipTrigAutoPlay = 1;
          this.playing = 1;

          await this.playList();
        } catch (ee) {
          console.log(ee);
        }
        this.skipTrigAutoPlay = 0;
        bus.$emit("finishPlayCurWords");
      })();
    });
  },

  watch: {
    playing(n) {
      if (n && !this.skipTrigAutoPlay) {
        this.playList();
      }
    },
    showCurWords(show) {
      this.showHideCurWords(show);
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
.ctrl {
  user-select: none;
  cursor: pointer;
}

.curWs {
  position: fixed;
  z-index: 10000;
  background: #f5f5f5;
  bottom: 50px;
  right: 0;
  padding-left: 3px;
  max-height: calc(100vh - 50px);
  overflow: auto;
  max-width: 25%;
  user-select: none;
  border-left: 2px dashed #ccc;
}
.curWs > div:not(:last-child) {
  border-bottom: 1px solid #ccc;
}
.curWs > div > * {
  margin-top: 10px;
}
.op_tool {
  position: fixed;
  right: 10px;
  bottom: 100px;
  cursor: pointer;
  width: 1em;
  z-index: 10001;
  user-select: none;
}
.op_tool > * {
  margin-bottom: 10px;
  user-select: none;
}
.playing {
  color: green;
  font-weight: bold;
}
.curWs > div:nth-child(odd) {
  background-color: #f5f5f5;
}
.curWs > div:nth-child(even) {
  background-color: #fff;
}
</style>
