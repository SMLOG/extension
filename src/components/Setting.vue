<template>
  <div>
    <div style="font-size: 0.8em; color: white">
      <div class="t_1">
        <span><input type="checkbox" @click="toggleHl()" />HL</span>
        <span @click="showSetting = !showSetting"> Setting </span>
        <span @click="refresh(true)"
          >Refresh<span v-if="refreshIndicator">...</span></span
        >
        <span class="version"> {{ version }}</span>
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
        <div style="color: red; font-weight: bold">{{ tokenMessage }}</div>
      </div>
      <div>
        Word upload:
        <a @click="mUpload()" style="cursor: pointer; color: red"
          >upload {{ uploadDate }}</a
        >
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
            MJ
            <input type="checkbox" v-model="config.mj" @change="updateConfig()"
          /></label>

          <label>
            Dict
            <input
              type="checkbox"
              v-model="config.dict"
              @change="updateConfig()"
          /></label>
        </div>

        <div
          style="
            text-align: left;
            margin: 5px 0;
            display: flex;
            justify-content: space-between;
          "
        >
          <div>
            Sound:
            <select v-model="config.autoSound" @change="updateConfig()">
              <option value="">No sound</option>
              <option value="BD">BD</option>
              <option value="YD">YD</option>
              <option value="auto">auto</option>
            </select>
          </div>
          <div>
            Preload:
            <input
              type="checkbox"
              v-model="config.preload"
              @change="updateConfig()"
            />
          </div>
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
import { version } from "@/version";
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
      uploadDate: "",
      version: version,

      config: {
        fzWords: 0,
        fzVideos: 0,
        shownews: 0,
        showvideos: 0,
        showwords: 0,
        autoSound: 0,
        preload: 0,
        dict: 0,
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
    let reqId = +new Date();
    service(null, { cmd: "getConfig", reqId: ++reqId }, (resp) => {
      Object.assign(this.config, resp);
      this.refresh();

      setInterval(() => {
        this.refresh();
      }, 1000 * 3600 * 3);
    });

    service(null, { cmd: "get", name: "user", reqId: ++reqId }, (resp) => {
      console.error("usr");
      this.tokenMessage = resp;
    });

    service(
      null,
      { cmd: "get", name: "uploadDate", reqId: ++reqId },
      (resp) => {
        this.uploadDate = resp;
      }
    );
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
      modules.sort().reverse();
      (async () => {
        for (let i = 0; i < modules.length; i++) {
          await Promise.all([
            new Promise((resolve) => {
              service(
                null,
                { cmd: "lists", force: force, type: modules[i] },
                (resp) => {
                  if (resp) {
                    if (resp.done) {
                      resolve();
                    }
                    if (resp.contents) {
                      console.error(modules[i], resp.contents);
                      self.$store.commit(modules[i], resp.contents);
                    }
                  }
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
        if (!resp.name) {
          setTimeout(() => {
            service(null, { cmd: "token" }, (resp) => {
              this.tokenMessage = resp;
            });
          }, 5000);
        }
      });
    },
    toggleHl() {
      if ($("html > head #newwordHl").length > 0) {
        $("html > head #newwordHl").remove();
      } else {
        $("html > head").append(
          $(`<style id="newwordHl" type = "text/css">
      .newWordb{   display:none;}
      </style>`)
        );
      }
    },
  },

  computed: {
    ...mapState(["curTab", "showApp", "curItem"]),
  },
  watch: {},
};
</script>
<style lang="scss" scoped>
.t_1 {
  text-align: left;
  user-select: none;
}
.t_1 > * {
  margin: 3px;
  color: white;
}
.t_1 > span {
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
.version {
  font-size: 40%;
  float: right;
}
</style>
