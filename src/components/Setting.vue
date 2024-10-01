<template>
  <div style="user-select: none">
    <div style="font-size: 0.8em; color: white">
      <div class="t_1">
        <span><input type="checkbox" @click="toggleHl()" />Hight Light</span>
        <span @click="refresh(true)"
          >Auto Refresh<span v-if="refreshIndicator">...</span></span
        >
        <input type="checkbox" v-model="config.autoRefresh" />
      </div>
    </div>
    <div
      style="
        font-size: 0.8em;
        color: white;
        text-align: left;
        border-top: 1px dashed white;
        padding: 5px;
      "
      v-show="showSetting"
    >
      <div style="display: flex; flex-wrap: wrap">
        <div>
          <span> Max retain list:</span>

          <label>
            <input
              style="max-width: 30px"
              min="30"
              v-model.number="config.retains"
              @change="upConfig()"
            />
          </label>
        </div>
        <div>
          <span> Loop&Seq Count:</span>

          <label>
            <input
              style="max-width: 30px"
              min="1"
              v-model.number="config.loopCount"
              @change="upConfig()"
            />
          </label>
        </div>

        <div style="text-align: left">
          Auto stop play after
          <label>
            <input
              v-model.number="pauseTimer"
              @blur="submitTimer"
              min="0"
              style="width: 40px"
          /></label>
          minus
          <span v-if="endTime">at {{ endTime | fmtDate }}</span>
        </div>
      </div>

      <div style="text-align: left">
        Enable:
        <div>
          <label>
            Radio
            <input type="checkbox" v-model="config.radio" @change="upConfig()"
          /></label>
          <label>
            Vidoes
            <input
              type="checkbox"
              v-model="config.showvideos"
              @change="upConfig()"
          /></label>
        </div>
      </div>

      <div
        style="
          text-align: left;
          margin: 5px 0;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
        "
      >
        <div>
          Sound:
          <select v-model="config.autoSound" @change="upConfig()">
            <option value="">No sound</option>
            <option value="auto">auto</option>
            <option v-for="v in voices" :key="v" :value="v">{{ v }}</option>
          </select>
        </div>

        <div>
          Translate Max Len:<input
            v-model="config.activeTran"
            type="checkbox"
          />
          <input
            style="width: 40px"
            v-model.number="config.maxTranLen"
            min="0"
          />
        </div>
        <div>
          Cache Video Number:
          <input
            style="width: 40px"
            v-model.number="config.playerNum"
            min="1"
            @change="upConfig()"
          />
        </div>

        <div>
          Dock List:<input
            v-model="config.dockList"
            type="checkbox"
            @change="upConfig()"
          />
        </div>
        <div>
          Subtitle display postion:<a
            @click="
              config.custCue = ++config.custCue > 3 ? 0 : config.custCue;
              upConfig();
            "
            >{{
              config.custCue == 0
                ? "Default"
                : config.custCue == 1
                ? "Bottom"
                : config.custCue == 2
                ? "Top"
                : "Disable"
            }}
          </a>
        </div>
        <div>
          Play with Max bit rate:<input
            type="checkbox"
            v-model="config.maxBitRate"
            @change="upConfig()"
          />
        </div>
      </div>
      <div>
        <div>Media Source List:</div>

        <div style="border: 1px solid rgb(204, 204, 204); padding: 5px">
          <div
            v-for="(source, index) in config.sources"
            :key="index"
            style="
              font-weight: bold;
              font-size: 120%;
              display: flex;
              justify-content: space-between;
            "
          >
            <input data-v-2d80735a="" type="checkbox" />
            <span data-v-2d80735a="">{{ source.type }}</span>
            <span data-v-2d80735a="">{{ source.url }}</span>
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

import bus from "@/bus";
export default {
  data() {
    return {
      pauseTimer: 0,
      pauseTimerTimer: 0,
      endTime: "",
      token: "",
      tokenMessage: "",
      showSetting: 1,
      refreshIndicator: 0,
      uploadDate: "",
      voices: ["YD", "BD", "BK", "SG"],
      rssIndex: -1,
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
  created() {
    const that = this;

    let exitFullscreenHandler = () => {
      setTimeout(() => {
        if (!this.isFullscreen() && that.config.viewMode === 0)
          this.updateConfig({ viewMode: -1 });
      }, 1000);
      // event.stopPropagation();
    };
    if (
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    ) {
      // Add event listener for fullscreenchange event
      document.addEventListener("fullscreenchange", exitFullscreenHandler);
      document.addEventListener(
        "webkitfullscreenchange",
        exitFullscreenHandler
      );
      document.addEventListener("mozfullscreenchange", exitFullscreenHandler);
      document.addEventListener("MSFullscreenChange", exitFullscreenHandler);
    }
  },
  mounted() {
    setTimeout(() => {
      if (this.config.autoRefresh) {
        this.refresh(true);
      }
    }, 1000);
    var reqId = +new Date();
    service(null, { cmd: "getConfig", reqId: ++reqId }, (resp) => {
      if (resp) {
        this.$store.commit("config", resp);
      }
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

    async loadmodsdata() {
      var self = this;

      let modules = [];

      for (let a in this.config)
        if (a.indexOf("show") == 0 && this.config[a]) {
          modules.push(a.substring(4));
        }
      modules.sort().reverse();

      for (let i = 0; i < modules.length; i++) {
        try {
          let data = await this.loadCache(modules[i]);
          self.$store.commit(modules[i], data || []);
        } catch (ee) {
          console.error(ee);
        }
      }

      bus.$on("fresh", (mod, force) => {
        this.refreshmode(mod, force);
      });
    },
    async refreshmode(mod, force) {
      var self = this;

      console.log(self.refreshIndicator);

      bus.$emit("fresh" + mod, force);
      console.log("fresh" + mod, force);

      if (this.$store[mod] && this.$store[mod].length > 0)
        await this.saveCache(mod, this.$store[mod]);

      let cacheData = {};
      await new Promise((resolve) => {
        service(null, { cmd: "lists", force: force, type: mod }, (resp) => {
          console.log(resp);
          if (resp) {
            if (resp.contents) {
              if (resp.contents.length) {
                console.error(resp.contents.length);
                console.error(
                  resp.contents.length,
                  this.config.retains,
                  resp.done
                );

                self.$store.commit(mod, resp.contents);
                cacheData[mod] = resp.contents;
              }
            }
            if (resp.done) {
              resolve();
            }
          }
        });
      });
      let ks = Object.keys(cacheData);
      for (var i = 0; i < ks.length; i++) {
        let mod = ks[i];
        await this.saveCache(mod, cacheData[mod]).catch((e) => {
          console.error(e);
        });
      }
    },
    async refresh(force) {
      var self = this;

      console.log(self.refreshIndicator);
      if (self.refreshIndicator) return;
      self.refreshIndicator = 1;
      let modules = [];

      for (let a in this.config)
        if (a.indexOf("show") == 0 && this.config[a]) {
          modules.push(a.substring(4));
        }
      modules.sort().reverse();
      for (let i = 0; i < modules.length; i++) {
        await this.refreshmode(modules[i], force);
      }
      self.refreshIndicator = 0;
    },
    upConfig() {
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
        if (resp) {
          this.tokenMessage = resp.message || resp.name;
          if (!resp.name) {
            setTimeout(() => {
              service(null, { cmd: "token" }, (resp) => {
                this.tokenMessage = resp;
                if (!resp) this.token = "";
              });
            }, 3000);
          }
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
  watch: {
    "$store.state.config.showvideos": {
      handler(n) {
        if (n && !Object.keys(this.config.urls).length) {
          window.location.reload();
        }
      },
    },
  },
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
  margin-right: 10px;
}

.version {
  font-size: 40%;
  float: right;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

ul li:not(:last-child) {
  border-bottom: 1px solid #aaa;
  margin-bottom: 10px;
  padding-bottom: 5px;
  word-break: break-all;
  overflow: hidden;
  max-width: 100%;
}

.rss {
  display: flex;
  justify-content: space-between;
  line-height: 1em;
}

.rss input {
  width: 100%;
}
</style>
