<template>
  <div>
    <div
      style="
        padding: 5px;
        background: white;
        max-height: calc(100vh - 180px);
        overflow: auto;
      "
      ref="words"
      class="witems"
    >
      <WordItem
        v-for="w in pageList"
        :key="w.q"
        style="padding: 5px 0"
        :word="w"
        ref="word"
        :playMode="playMode"
        :playing="playing"
        :playRel="playRel"
      />
    </div>

    <div class="bottom">
      <a @click="changePlayMode()" :class="{ playing: playing }"
        >Play{{ playMode }}</a
      >

      <a v-if="relwords" @click="playRel = playRel >= 20 ? 0 : playRel + 5">
        PR{{ playRel }}
      </a>
      <div style="text-align: right; float: right">
        (<input style="width: 25px" v-model="page" />/{{ pages }})
        <a class="ctrl" @click="toPage(parseInt(page) - 1)"> Prev </a>
        <a class="ctrl" @click="toPage(parseInt(page) + 1)"> Next </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import bus from "@/bus";
import WordItem from "./WordItem.vue";

export default {
  data() {
    return {
      pageSize: 5,
      page: 1,
      playMode: 0,
      playRel: 0,
      playing: 0,
    };
  },
  created() {},
  components: {
    WordItem,
  },
  computed: {
    relwords() {
      return this.$store.state.config.relwords;
    },
    pageList() {
      let list = this.words;
      if (list.length == 0) return list;
      return list.slice(
        (this.page - 1) * this.pageSize,
        this.page * this.pageSize
      );
    },
    pages() {
      let list = this.words;

      return Math.floor((list.length + this.pageSize - 1) / this.pageSize);
    },
    ...mapState(["curItem", "words"]),
  },
  methods: {
    changePlayMode() {
      if (this.playing && this.playMode) {
        this.playMode = this.playMode > 2 ? 0 : this.playMode + 1;
        if (this.playMode == 0) this.playing = 0;
      } else {
        this.playing = !this.playing;
        if (!this.playMode) this.playMode = 1;
      }
    },
    changePlayNum(event) {
      console.log(event);
    },

    getPageItems(p) {
      let list = this.words;
      if (list.length == 0) return [];
      return list.slice(p * this.pageSize, (p + 1) * this.pageSize);
    },
    toPage(i) {
      if (i < 1 || i > this.pages) return;
      this.page = i;
    },

    async playList() {
      for (let p = this.page - 1; p < this.pages; p++) {
        let pageList = this.getPageItems(p);

        console.error(this.$refs.word.length, 0 < this.$refs.word.length);
        //for (let d = 0; d < pageList.length; d++) {
        for (let d = 0; d < this.$refs.word.length; d++) {
          if (!this.playing) {
            this.$store.commit("curPlay", null);

            return;
          }
          console.log(pageList[d].q, pageList[d], this.$refs.word[d]);
          await this.sleep(1);
          //await this.playSound(pageList[d], true);
          await this.$refs.word[d].playWords(this.$refs.words);
        }
        this.page++;
        await this.sleep(1);
      }
      this.playing = 0;
    },
  },
  mounted() {
    bus.$on("toggleAutoPlay", () => {
      this.playing = !this.playing;
    });
  },

  watch: {
    playing(n) {
      if (n) {
        this.playList();
      }
    },
  },
};
</script>

<style scoped>
p {
  font-size: 20px;
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
.bottom {
  text-align: left;
  font-size: 0.8em;
  color: white;
  user-select: none;
  background-color: gray;
}
.bottom input[type="text"] {
  user-select: auto;
}
input,
select {
  color: black !important;
}
.playing {
  color: green;
  font-weight: bold;
}

.witems > div:nth-child(odd) {
  background-color: #f5f5f5;
}
.witems > div:nth-child(even) {
  background-color: #fff;
}
</style>
