<template>
  <div style="padding: 5px 0" class="word">
    <div :class="{ detach: !word.i & word.n, remove: !word.n }">
      <div
        @click="playSound(word)"
        style="cursor: pointer"
        :class="{ cur: curPlay == word.q }"
      >
        {{ word.q }}
        <b v-if="word.am"> [{{ word.am }}]</b>
      </div>
      <div style="font-weight: bold">
        <span style="cursor: pointer" @click="toggleItemIsNew(word, $event)">{{
          word.to
        }}</span>
      </div>
    </div>
    <div v-for="word in rwords" :key="word.q" class="rword">
      <div
        @click="playSound(word)"
        style="cursor: pointer"
        :class="{ cur: curPlay == word.q }"
      >
        {{ word.q }}
        <b v-if="word.am"> [{{ word.am }}]</b>
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
  props: ["word", "curPlay"],
  data() {
    return {
      rwords: [],
    };
  },
  created() {},
  computed: {},
  methods: {
    loadRords() {
      if (!window.rwords || !window.rwords[this.word.q]) {
        let self = this;
        $.ajax({
          url:
            "http://localhost/word/r/" +
            this.word.q.substring(0, 2) +
            "/" +
            this.word.q +
            ".js",
          type: "get",
          dataType: "jsonp",
          jsonpCallback: "cb",
          timeout: 5000,
          cache: 1,

          success: function (data) {
            self.rwords.length = 0;
            if (!window.rwords) window.rwords = [];
            window.rwords[self.word.q] = data[1].map((e) => {
              return { q: e[0], to: e[1], am: e[2] };
            });
            window.rwords[self.word.q].length = Math.min(
              window.rwords[self.word.q].length,
              5
            );

            self.rwords.push(...window.rwords[self.word.q]);
          },
          error: function (err) {
            console.error(err);
            self.rwords.length = 0;
          },
        });
      }
    },
  },
  mounted() {
    console.log("load");
    //this.loadRords();
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

.word .rword:not(:last-child) {
  border-bottom: 1px solid;
}
.cur {
  color: green !important;
  font-weight: bold;
}
</style>
