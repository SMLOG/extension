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
            <input
              type="checkbox"
              :v-model="item.n"
              :checked="item.n"
              value="true"
              @change="toggleItemIsNew(item)"
              @mouseup="clickNewWord($event)"
            />
            <a class="ctrl" style="font-size: 6px"> 新</a>
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
      <label>
        <input
          type="checkbox"
          @mouseup.stop=""
          v-model="autoplaynew"
          :checked="autoplaynew"
        />
        Play
      </label>
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
import { service } from "@/service";
import bus from "@/bus";

export default {
  data() {
    return {
      pageSize: 5,
      page: 1,
      autoplaynew: false,
      curPlay: "",
      isSpell: false,
      playNum: 0,
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
    changePlayNum(event) {
      console.log(event);
    },
    clickNewWord(event) {
      // event.preventDefault();
      event.stopPropagation();
      return false;
    },
    toPage(i) {
      if (i < 1 || i > this.pages) return;
      this.page = i;
    },
    toggleItemIsNew(item) {
      item.n = item.n > 0 ? 0 : 1;

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
    async tts(lan, content, wait) {
      return new Promise((resolve) => {
        service(
          null,
          {
            cmd: "audio",
            content: content,
            wait: wait,
            lang: lan,
          },
          function (response) {
            console.log(response);
            resolve();
          }
        );
      });
    },
    playSound(item, wait, lan = "en") {
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
    async autoPlayNew() {
      let list = this.words;
      let start = (this.page - 1) * this.pageSize;
      let from = (this.page - 1) * this.pageSize;
      let end = list.length;

      for (let k = 0; k < 100; k++) {
        if (parseInt(this.playNum) > 0) {
          end = start + parseInt(this.playNum);
        }
        for (let i = start; i < Math.min(end, list.length); i++) {
          if (!this.autoplaynew) {
            this.curPlay = "";
            this.$store.commit("curPlay", null);

            return;
          }

          this.toPage(Math.floor(i / this.pageSize) + 1);
          this.$store.commit("curPlay", list[i]);
          this.curPlay = list[i].q;
          await this.playSound(list[i], true);
          if (this.isSpell) {
            await this.sleep(1000);
            let chars = this.curPlay.split("").map((e) => e);
            for (let d = 0; d < chars.length; d++)
              await this.tts("en", chars[d], true);
          }
          await this.playSound(list[i], true, "zh");
          await this.sleep(1000);
        }

        start = parseInt(this.playNum) > 0 ? from : 0;
      }
    },
  },
  mounted() {
    bus.$on("change", (item) => {
      this.changeItemNew(item);
    });
    bus.$on("toggleAutoPlay", () => {
      this.autoplaynew = !this.autoplaynew;
    });
  },

  watch: {
    autoplaynew(n) {
      if (n) {
        this.autoPlayNew();
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
  color: red;
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
</style>
