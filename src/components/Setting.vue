<template>
  <div>
    <div style="font-size: 0.8em; color: white">
      <div class="tools">
        <span><input type="checkbox" @click="toggleHl()" />HL</span>
        <span @click="showSetting = !showSetting"> Setting </span>
        <span @click="refresh(true)"
          >Refresh<span v-if="refreshIndicator">...</span></span
        >
      </div>
    </div>
    <div
      style="
        font-size: 0.8em;
        color: white;
        text-align: left;
        border-top: 1px dashed white;
      "
      v-show="showSetting"
    >
      <div>Timer:</div>
      <div style="text-align: left">
        Would pause after
        <input
          v-model="pauseTimer"
          @blur="submitTimer"
          type="number"
          style="width: 40px"
        />
        minus
        <span v-if="endTime">at {{ endTime | fmtDate }}</span>
      </div>
      <div style="text-align: left">
        Token:
        <div>
          <input
            v-model="token"
            style="width: 100%; box-sizing: border-box"
            @blur="submitToken()"
          />
        </div>
        <div>{{ tokenMessage }}</div>
      </div>
      <div>
        Merge upload:
        <a @click="mUpload()" style="cursor: pointer; color: red">upload</a>
      </div>
      <div>
        Upload
        <div>
          only when new word reach
          <select v-model="config.fzWords" @change="updateConfig()">
            <option value="0">Disable</option>
            <option v-for="i in [1, 5, 10, 20, 50, 100]" :value="i" :key="i">
              {{ i }}
            </option>
          </select>
        </div>

        <div>
          only when new video reach
          <select v-model="config.fzVideos" @change="updateConfig()">
            <option value="0">Disable</option>
            <option v-for="i in [1, 5, 10, 20, 50, 100]" :value="i" :key="i">
              {{ i }}
            </option>
          </select>
        </div>
      </div>

      <div style="text-align: left">
        Enable:
        <div>
          <label>
            transHtml
            <input
              type="checkbox"
              v-model="transHtml"
              @change="changeTransHtml()"
          /></label>
        </div>
      </div>
      <div style="text-align: left">
        Enable:
        <div>
          <label>
            News
            <input
              type="checkbox"
              v-model="config.shownews"
              @change="updateConfig()"
          /></label>
          <label>
            Vidoes
            <input
              type="checkbox"
              v-model="config.showvideos"
              @change="updateConfig()"
          /></label>
          <label>
            Words
            <input
              type="checkbox"
              v-model="config.showwords"
              @change="updateConfig()"
          /></label>
          <label>
            Sound
            <input
              type="checkbox"
              v-model="config.autoSound"
              @change="updateConfig()"
          /></label>

          <label>
            MJ
            <input type="checkbox" v-model="config.mj" @change="updateConfig()"
          /></label>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import $ from "jquery";
import { service } from "@/service";
import storejs from "storejs";
export default {
  data() {
    return {
      pauseTimer: 0,
      pauseTimerTimer: 0,
      endTime: "",
      token: "",
      tokenMessage: "",
      showSetting: 0,
      refreshIndicator: 0,
      transHtml: storejs.get("transHtml"),

      config: {
        fzWords: 0,
        fzVideos: 0,
        shownews: 0,
        showvideos: 0,
        showwords: 0,
        autoSound: 0,
      },
    };
  },
  filters: {
    fmtDate(date) {
      if (date) {
        return (
          date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
        );
      }
      return "";
    },
  },
  mounted() {
    service(null, { cmd: "getConfig", reqId: +new Date() }, (resp) => {
      Object.assign(this.config, resp);
      this.refresh();

      setInterval(() => {
        this.refresh();
      }, 1000 * 3600 * 3);
    });
  },

  methods: {
    focus(event) {
      setTimeout(() => {
        event.target.focus();
      }, 1000);
    },

    mUpload() {
      this.$store.commit("setLoading", 1);

      if (this.loading) return;
      this.loading = 1;
      service(null, { cmd: "mUpload" }, (resp) => {
        if (resp) this.refresh();
        this.$store.commit("setLoading", 0);
        this.loading = 0;
      });
    },
    changeTransHtml() {
      storejs.set("transHtml", this.transHtml);
    },
    refresh(force) {
      var self = this;

      if (self.refreshIndicator) return;
      self.refreshIndicator = 1;
      let modules = [];

      for (let a in this.config)
        if (a.indexOf("show") == 0 && this.config[a]) {
          modules.push(a.substring(4));
        }

      (async () => {
        for (let i = 0; i < modules.length; i++) {
          await Promise.all([
            new Promise((resolve) => {
              service(
                null,
                { cmd: "lists", force: force, type: modules[i] },
                (resp) => {
                  if (resp.done) {
                    resolve();
                  }
                  if (resp.contents)
                    self.$store.commit(modules[i], resp.contents);
                }
              );
            }),
          ]);
        }
        self.refreshIndicator = 0;
      })();
    },
    updateConfig() {
      service(null, { cmd: "setConfig", content: this.config }, () => {
        this.$store.commit("config", this.config);
      });
    },
    submitTimer() {
      clearTimeout(this.pauseTimerTimer);
      console.log("pause");
      let self = this;
      let n = parseInt(this.pauseTimer);
      if (n > 0) {
        let start = new Date().getTime();
        self.endTime = new Date(start + n * 60 * 1000);

        this.pauseTimerTimer = setTimeout(() => {
          $("audio,video").each(function () {
            $(this)[0].pause();
          });
          service(null, { cmd: "audio", pause: true }, function () {
            console.log("audio pause");
          });
          self.pauseTimer = 0;
          self.endTime = "";
        }, n * 60 * 1000);
      }
    },
    submitToken() {
      this.tokenMessage = "";
      service(null, { cmd: "token", content: this.token }, (resp) => {
        this.tokenMessage = resp.message || resp.name;
      });
    },
  },

  computed: {
    ...mapState(["curTab", "showApp", "curItem"]),
  },
  watch: {},
};
</script>
<style lang="scss" scoped>
.tools {
  text-align: left;
  user-select: none;
}
.tools > * {
  margin: 3px;
  color: white;
}
.tools > span {
  display: inline-block;
  cursor: pointer;
}
.red {
  color: red;
}
.green {
  color: lightgreen;
}
label {
  display: inline-block;
  border-bottom: 1px solid white;
  margin-right: 5px;
}
</style>
