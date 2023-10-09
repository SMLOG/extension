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
    <div v-for="word in relwordList" :key="word.q" class="rword" ref="rword">
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
      rwords: [],
    };
  },
  created() {},
  computed: {
    relwordList() {
      return this.rwords.slice(0, Math.min(this.rwords.length, this.playRel));
    },
    relwords() {
      return this.$store.state.config.relwords;
    },
  },
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
      let rwords = this.rwords;
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
          console.error(i);
          await this.playSound(item, true);
        }
      })();
    },

    loadRords(word) {
      if (!word) return;
      console.log(word.q);
      let self = this;
      $.ajax({
        url: "/data/word/r/" + word.q.substring(0, 2) + "/" + word.q + ".js",
        type: "get",
        dataType: "jsonp",
        jsonpCallback: word.q,
        timeout: 5000,
        cache: 1,
        success: function (data) {
          console.log(data);
          self.rwords.length = 0;
          let list = data[1].map((e) => {
            return { q: e[0], to: e[1], am: e[2] };
          });

          self.rwords.push(...list);
        },
        error: function (err) {
          console.error(err);
          self.rwords.length = 0;
        },
      });
    },
  },
  mounted() {
    console.log("load");
    if (this.relwords) this.loadRords(this.word);
  },

  watch: {
    relwords(n) {
      if (n) this.loadRords(this.word);
      else this.rwords.splice(0, this.rwords.length);
    },
  },
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
