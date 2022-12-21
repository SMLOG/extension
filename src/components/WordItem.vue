<template>
  <div style="padding: 5px 0" class="word" ref="word">
    <div :class="{ detach: !word.i & word.n, remove: !word.n }">
      <div
        @click="playSound(word)"
        style="cursor: pointer"
        :class="{ cur: curPlay == word.q }"
      >
        {{ word.q }}
        <b v-if="word.am" @mouseenter="onEnterPlay($event, word)">
          [{{ word.am }}]</b
        >
      </div>
      <div style="font-weight: bold">
        <span style="cursor: pointer" @click="toggleItemIsNew(word, $event)">{{
          word.to
        }}</span>
      </div>
    </div>
    <div v-for="word in rwords" :key="word.q" class="rword" ref="rword">
      <div
        @click="playSound(word)"
        style="cursor: pointer"
        :class="{ cur: curPlay == word.q }"
      >
        {{ word.q }}
        <b v-if="word.am" @mouseenter="onEnterPlay($event, word)">
          [{{ word.am }}]</b
        >
      </div>
      <div>
        <span style="cursor: pointer" @click="toggleItemIsNew(word, $event)">{{
          word.to
        }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import $ from "jquery";
export default {
  props: ["word", "playing", "playMode", "playRel"],
  data() {
    return {
      curPlay: "",
    };
  },
  created() {},
  computed: {},
  methods: {
    async playWords(pel) {
      let $pel = $(pel);
      this.curPlay = this.word.q;
      console.error(this.word, this.playing);
      this.scroll2el($(this.$refs.word), $pel);
      if (!this.playing) return;

      await this.playSound(this.word, true);

      if (this.playMode >= 2) {
        await this.sleep(500);
        await this.playSound(this.word, true);
      }

      if (this.isSpell) {
        await this.sleep(1000);
        let chars = this.curPlay.split("").map((e) => e);
        // .join(" ");
        for (let d = 0; d < chars.length; d++)
          await this.tts("en", chars[d], true, 6);
      }
      if (this.playMode >= 3) await this.playSound(this.word, true, "zh");
      await this.sleep(1000);

      if (this.playRel) {
        await this.playRwords($pel);
      }
      this.curPlay = "";
    },
    async playRwords($pel) {
      let item = this.word;
      if (window.rwords && window.rwords[item.q]) {
        let rwords = window.rwords[item.q];
        for (let i = 0; i < rwords.length; i++) {
          if (!this.playing) return;
          this.curPlay = rwords[i].q;
          console.log(this.$refs.rword[i].el, this.$refs.rword[i]);
          this.scroll2el($(this.$refs.rword[i]), $pel);
          await this.playSound(rwords[i], true);
          if (this.playMode >= 2) await this.playSound(rwords[i], true);
          if (this.playMode >= 3) await this.playSound(rwords[i], true, "zh");
          await this.sleep(1000);
        }
      }
    },
    onEnterPlay(event, item) {
      (async () => {
        var stop = false;

        let handle = function () {
          stop = true;
          event.target.removeEventListener("mouseout", handle);
        };

        event.target.addEventListener("mouseout", handle);
        for (let i = 0; i < 100; i++) {
          if (stop) return;
          await this.playSound(item, true);
        }
      })();
    },
  },
  mounted() {
    console.log("load");
    //this.loadRords(this.word);
  },

  watch: {},
};
</script>

<style scoped>
.detach {
  color: red;
}
.remove {
  color: orange;
  text-decoration: line-through;
}
.rword {
  border-left: 1px blue solid;
  margin-left: 2px;
  padding-left: 2px;

  padding-bottom: 5px;
  padding-top: 5px;
}

.word {
  text-align: left;
  max-width: 400px;
}
.word .rword:not(:last-child) {
  border-bottom: 1px solid;
}
.cur {
  color: green !important;
  font-weight: bold;
}
</style>
