<template>
  <div>
    <div style="padding: 5px; background: white">
      <table style="text-align: left; width: 100%">
        <tr
          v-for="item in pageList"
          :key="item.dt"
          :class="{ cur: item.q == curPlay }"
        >
          <td>
            <div :class="{ detach: !item.i, remove: item.i && !item.n }">
              {{ item.q }} <b v-if="item.am"> [{{ item.am }}]</b>
              <div>{{ item.to }}</div>
            </div>
          </td>
          <td width="40px">
            <a
              class="ctrl"
              style="font-size: 6px"
              @click="toggleItemIsNew(item, $event)"
              :style="{
                color: item.n ? 'green' : 'red',
                textDecoration: item.n ? 'none' : 'line-through',
              }"
            >
              New</a
            >
            <br />
            <a
              class="ctrl"
              @click="playSound(item)"
              @mouseenter="onEnterPlay($event, item)"
              ><span class="icon-sound">Play</span>
            </a>
          </td>
        </tr>
      </table>
    </div>

    <div class="bottom">
      <a @click="changePlayMode()" :class="{ playing: playing }"
        >Play{{ playMode }}</a
      >

      <select v-model="playNum" @change="changePlayNum($event)">
        <option value="0">All</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="30">30</option>
        <option value="40">40</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
      <label>
        <input
          type="checkbox"
          @mouseup.stop=""
          v-model="isSpell"
          :checked="isSpell"
        />
        Spell
      </label>
      <div style="text-align: right; float: right">
        (<input style="width: 25px" v-model="page" />/{{ pages }})
        <a class="ctrl" @click="toPage(page - 1)"> Prev </a>
        <a class="ctrl" @click="toPage(page + 1)"> Next </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import bus from "@/bus";

export default {
  data() {
    return {
      pageSize: 5,
      page: 1,
      playMode: 0,
      curPlay: "",
      isSpell: false,
      playNum: 0,
      playing: 0,
    };
  },
  created() {},
  computed: {
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

    toPage(i) {
      if (i < 1 || i > this.pages) return;
      this.page = i;
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

    async playList() {
      let list = this.words;
      let start = (this.page - 1) * this.pageSize;
      let from = (this.page - 1) * this.pageSize;
      let end = list.length;

      for (let k = 0; k < 100; k++) {
        if (parseInt(this.playNum) > 0) {
          end = start + parseInt(this.playNum);
        }
        for (let i = start; i < Math.min(end, list.length); i++) {
          if (!this.playing) {
            this.curPlay = "";
            this.$store.commit("curPlay", null);

            return;
          }

          this.toPage(Math.floor(i / this.pageSize) + 1);
          this.$store.commit("curPlay", list[i]);
          this.curPlay = list[i].q;
          console.error(this.curPlay);
          await this.playSound(list[i], true);

          if (this.playMode >= 2) {
            await this.sleep(500);
            await this.playSound(list[i], true);
          }

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

        start = parseInt(this.playNum) > 0 ? from : 0;
      }
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
.bottom {
  text-align: left;
  font-size: 0.8em;
  color: white;
  user-select: none;
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
</style>
