<template>
  <div>
    <div class="curWs" ref="curWs" v-show="config.seeCurWords">
      <WordItem
        v-for="w in curWords"
        :key="w.q"
        :curPlay="curPlay"
        style="padding: 5px 0"
        :word="w"
        ref="word"
        :playMode="playMode"
        :playing="config2.playing"
        :playRel="3"
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
      curPlay: "",
      isSpell: false,
      playNum: 0,
    };
  },
  created() {},
  computed: {
    ...mapState(["curWords", "seeCurWords"]),
  },
  components: {
    WordItem,
  },
  methods: {
    async playList() {
      let pageList = this.curWords;

      if (pageList.length)
        for (let d = 0; d < this.$refs.word.length; d++) {
          if (!this.config2.playing) {
            this.curPlay = "";
            return;
          }

          console.log(pageList[d].q, pageList[d], this.$refs.word[d]);

          //await this.playSound(pageList[d], true);
          await this.sleep(10);
          await this.$refs.word[d].playWords(this.$refs.curWs);
        }

      this.updateConfig2({ playing: 0 });
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
      this.showHideCurWords(this.seeCurWords);
    });

    bus.$on("newWord", (item) => {
      this.$store.commit("add2CurWords", [[item]]);
    });
    bus.$on("playCurWords", () => {
      (async () => {
        if (this.config2.playing) {
          this.updateConfig2({ playing: 0 });
        } else {
          this.updateConfig2({ playing: 1 });
          this.skipTrigAutoPlay = 1;
          try {
            await this.playList();
          } catch (ee) {
            console.log(ee);
          }
          this.skipTrigAutoPlay = 0;
        }

        bus.$emit("finishPlayCurWords");
      })();
    });
  },

  watch: {
    "$store.state.config2.playing": {
      handler(n) {
        if (n && !this.skipTrigAutoPlay) {
          this.playList();
        }
      },
    },
    "$store.state.config.seeCurWords": {
      handler(show) {
        this.showHideCurWords(show);
      },
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
