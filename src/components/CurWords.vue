<template>
  <div>
    <div class="op_tool">
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
      <div
        v-show="showCurWords"
        v-for="w in curWords"
        :key="w.q"
        :class="{ cur: w.q == curPlay }"
        style="padding: 5px 0"
      >
        <div :class="{ detach: !w.i & w.n, remove: !w.n }">
          <div @click="playSound(w)" style="cursor: pointer">
            {{ w.q }}
            <b v-if="w.am"> [{{ w.am }}]</b>
          </div>
          <div style="font-weight: bold">
            <span style="cursor: pointer" @click="toggleItemIsNew(w, $event)">{{
              w.to
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import bus from "@/bus";
import $ from "jquery";
export default {
  data() {
    return {
      playMode: (localStorage.playMode && parseInt(localStorage.playMode)) || 0,
      playing: 0,
      curPlay: "",
      isSpell: false,
      playNum: 0,
    };
  },
  created() {},
  computed: {
    ...mapState(["curWords", "showCurWords"]),
  },
  methods: {
    togglePlayAndMode() {
      this.playMode++;
      if (this.playMode > 3) this.playMode = 1;
      localStorage.playMode = this.playMode;
    },
    setShowCurWords(b) {
      this.$store.commit("setShowCurWords", b);
    },
    showApp() {
      console.log("error");
      setTimeout(() => {
        this.$store.commit("setShowApp", true);
      }, 500);
    },
    changePlayNum(event) {
      console.log(event);
    },

    onEnterPlay(event, item) {
      (async () => {
        var self = this;
        var stop = false;

        let handle = function () {
          stop = true;
          event.target.removeEventListener("mouseout", handle);
        };

        event.target.addEventListener("mouseout", handle);
        for (let i = 0; i < 100; i++) {
          if (stop) return;
          await self.playSound(item, true);
        }
      })();
    },

    async playList(b) {
      let list = this.curWords;

      let st = 0;

      for (let i = 0; ; i++) {
        if (i >= list.length) break;
        if (!b && !this.playing) {
          this.curPlay = "";

          return;
        }

        $(this.$refs.curWs).animate({
          scrollTop: st + "px",
        });
        st += $(this.$refs.curWs).children().eq(i).outerHeight();
        console.error(i, st);
        this.curPlay = list[i].q;
        console.error(this.curPlay);
        await this.playSound(list[i], true);

        if (this.playMode >= 2) await this.playSound(list[i], true);

        if (this.isSpell) {
          await this.sleep(1000);
          let chars = this.curPlay.split("").map((e) => e);
          // .join(" ");
          for (let d = 0; d < chars.length; d++)
            await this.tts("en", chars[d], true, 6);
        }
        if (this.playMode >= 3) await this.playSound(list[i], true, "zh");
        await this.sleep(1000);
      }
      this.playing = 0;
    },
  },
  mounted() {
    bus.$on("newWord", (item) => {
      this.$store.commit("add2CurWords", [[item]]);
    });
    bus.$on("playCurWords", () => {
      (async () => {
        try {
          await this.playList(1);
        } catch (ee) {
          console.log(ee);
        }
        bus.$emit("finishPlayCurWords");
      })();
    });
  },

  watch: {
    playing(n) {
      if (n) {
        this.playList();
      }
    },
    showCurWords(n) {
      let ww = $(window).width();
      if ($(".videoCon").is(":visible")) {
        let vw = $(".videoCon").width();
        let dockside = vw > 0 && ww - vw < ww * 0.25;

        $(this.$refs.curWs).css(
          "top",
          dockside ? $(".text").offset().top + "px" : "auto"
        );
        if (n) {
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
        if (n) {
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
.cur {
}
.cur div {
  color: green !important;
  font-weight: bold;
}
.detach {
  color: red;
}
.remove {
  color: orange;
  text-decoration: line-through;
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
  opacity: 0.2;
  user-select: none;
}
.op_tool > * {
  margin-bottom: 10px;
}
.playing {
  color: green;
  font-weight: bold;
}
</style>
