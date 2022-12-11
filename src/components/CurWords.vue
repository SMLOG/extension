<template>
  <div class="curWs" ref="curWs">
    <div
      style="
        position: fixed;
        right: 10px;
        bottom: 100px;
        cursor: pointer;
        width: 1em;
      "
    >
      <span v-show="autoplaynew">{{ autoplaynew }}</span>
      <font-awesome-icon
        @click="autoplaynew = autoplaynew > 2 ? 0 : autoplaynew + 1"
        icon="arrow-circle-down"
        fixed-width
        v-show="showCurWords"
      ></font-awesome-icon>

      <font-awesome-icon
        @click="setShowCurWords(!showCurWords)"
        icon="arrow-circle-left"
        fixed-width
        v-show="!showCurWords"
      />
      <font-awesome-icon
        @click="setShowCurWords(!showCurWords)"
        icon="arrow-circle-right"
        fixed-width
        v-show="showCurWords"
      />

      <font-awesome-icon @click="showApp()" icon="eye" fixed-width />
    </div>
    <div
      v-show="showCurWords"
      v-for="w in curWords"
      :key="w.q"
      :class="{ cur: w.q == curPlay }"
      style="padding: 5px 0"
    >
      <div :class="{ detach: !w.i, remove: w.i && !w.n }">
        <div @click="playSound(w)" style="cursor: pointer">
          {{ w.q }}
          <b v-if="w.am"> [{{ w.am }}]</b>
        </div>
        <div style="font-weight: bold">
          <span style="cursor: pointer" @click="toggleItemIsNew(w)">{{
            w.to
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { service } from "@/service";
import bus from "@/bus";
import $ from "jquery";
export default {
  data() {
    return {
      autoplaynew: 0,
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

    toggleItemIsNew(item) {
      item.n = item.n > 0 ? 0 : 1;
      item.i = item.n ? 0 : item.i;

      this.changeItemNew(item);
    },
    changeItemNew(item) {
      console.log(item);
      if (item.q.trim())
        service(null, { cmd: "newWord", content: item }, (resp) => {
          // this.$store.commit("setCurItem", resp.contents);
          this.$store.commit("newWord", resp.contents);
        });
    },
    cn(item) {
      let str = item.to
        .split(";")
        .map((e) => {
          let t = e.indexOf(".");
          return t > 0 && t < 5 ? e.substring(t + 1) : e;
        })
        .join(" ");
      return str;
    },
    async tts(lan, content, wait, speed) {
      return new Promise((resolve) => {
        service(
          null,
          {
            cmd: "audio",
            content: content,
            wait: wait,
            lang: lan,
            speed: speed,
          },
          function (response) {
            if (response) resolve();
          }
        );
      });
    },
    async playSound(item, wait, lan = "en") {
      let self = this;
      let content = lan == "en" ? item.q : self.cn(item);

      return this.tts(lan, content, wait);
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
    async sleep(t) {
      return new Promise((resolve) => {
        setTimeout(resolve, t);
      });
    },
    async autoPlayNew(b) {
      let list = this.curWords;
      let end = list.length;

      let st = 0;

      for (let i = 0; i < Math.min(end, list.length); i++) {
        if (!b && !this.autoplaynew) {
          this.curPlay = "";

          return;
        }

        $(this.$refs.curWs).animate({
          scrollTop: st + "px",
        });
        st += $(this.$refs.curWs)
          .find("> div")
          .eq(i + 1)
          .outerHeight();
        console.error(i, st);
        this.curPlay = list[i].q;
        console.error(this.curPlay);
        await this.playSound(list[i], true);

        if (this.autoplaynew == 2) await this.playSound(list[i], true);

        if (this.isSpell) {
          await this.sleep(1000);
          let chars = this.curPlay.split("").map((e) => e);
          // .join(" ");
          for (let d = 0; d < chars.length; d++)
            await this.tts("en", chars[d], true, 6);
        }
        if (this.autoplaynew == 3) await this.playSound(list[i], true, "zh");
        await this.sleep(1000);
      }
    },
  },
  mounted() {
    bus.$on("newWord", (item) => {
      this.$store.commit("add2CurWords", [[item]]);
    });
    bus.$on("playCurWords", () => {
      (async () => {
        try {
          await this.autoPlayNew(1);
        } catch (ee) {
          console.log(ee);
        }
        bus.$emit("finishPlayCurWords");
      })();
    });
  },

  watch: {
    autoplaynew(n) {
      if (n) {
        this.autoPlayNew();
      }
    },
    showCurWords(n) {
      let ww = $(window).width();
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
  z-index: 100000;
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
</style>
