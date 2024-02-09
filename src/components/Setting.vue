<template>
  <div>
    <div style="font-size: 0.8em; color: white">
      <div class="t_1">
        <span><input type="checkbox" @click="toggleHl()" />HL</span>
        <span @click="showSetting = !showSetting"> Setting </span>
        <span @click="refresh(true)"
          >Refresh<span v-if="refreshIndicator">...</span></span
        >
        <input type="checkbox" v-model="config.autoRefresh" />

        <span> Editor</span>
        <input
          type="checkbox"
          v-model="config.editor"
          @change="updateConfig()"
        />
        <span> Dev</span>
        <input
          type="checkbox"
          v-model="config.dev"
          @change="updateConfig()"
        />
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
      <div>
        <div>
          Translate Url:<input
            v-model="config.tranUrl"
            @blur="updateConfig()"
          />
        </div>
      </div>
      <div>
        <div>
          Back ground Audio keep live
          <label>
            <input
              type="checkbox"
              v-model="config.bgkeeplive"
              @change="updateConfig()"
          /></label>
        </div>
        <audio
          @click.stop
          v-show="config.bgkeeplive"
          id="bgAudio"
          controls
        ></audio>
      </div>

      <div style="display: flex; flex-wrap: wrap">
        <div>
          <span> Retain:</span>

          <label>
            <input
              style="max-width: 30px"
              min="30"
              v-model.number="config.retains"
              @change="updateConfig()"
            />
          </label>
        </div>
        <div>
          <span> Loop Count:</span>

          <label>
            <input
              style="max-width: 30px"
              min="1"
              v-model.number="config.loopCount"
              @change="updateConfig()"
            />
          </label>
        </div>
        <div>
          <span> Timeout Next:</span>

          <label>
            <input
              type="checkbox"
              v-model="config.timeoutnext"
              @change="updateConfig()"
          /></label>
        </div>
        <div style="text-align: left">
          Stop after
          <input
            v-model.number="pauseTimer"
            @blur="submitTimer"
            min="0"
            style="width: 40px"
          />
          minus
          <span v-if="endTime">at {{ endTime | fmtDate }}</span>
        </div>
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
      <div v-if="token">
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
              <option
                v-for="i in [1, 3, 5, 10, 20, 50, 100]"
                :value="i"
                :key="i"
              >
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
      </div>

      <div style="text-align: left">
        Enable:
        <div>
          <label>
            Radio
            <input
              type="checkbox"
              v-model="config.radio"
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

          <label>
            Rel Words
            <input
              type="checkbox"
              v-model="config.relwords"
              @change="updateConfig()"
          /></label>
        </div>
      </div>
      <div>
        <label>
          Vidoes
          <input
            type="checkbox"
            v-model="config.showvideos"
            @change="updateConfig()"
        /></label>
        <div style="max-height: 50vh; overflow: auto" v-if="config.showvideos">
          <ul style="border: 1px solid #ccc; padding: 5px">
            <li v-for="(arr, name) in config.urls" :key="name">
              <div
                style="
                  font-weight: bold;
                  font-size: 120%;
                  display: flex;
                  justify-content: space-between;
                "
              >
                <span>{{ name }}</span
                ><input
                  type="checkbox"
                  @click="arr.forEach((e) => (e.enable = !e.enable))"
                  @change="updateConfig()"
                />
              </div>
              <div v-for="g in arr" :key="g.url" style="display: flex">
                <div
                  style="
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    overflow: hidden;
                    flex-grow: 1;
                  "
                >
                  ... {{ g.url.substr(-40) }}
                </div>
                <input
                  type="checkbox"
                  v-model="g.enable"
                  @change="updateConfig()"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div style="user-select: none">
        <div
          style="
            text-align: left;
            margin: 5px 0px;
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            color: black;
            font-size: 120%;
          "
        >
          <span>
            Rss:
            <input
              type="checkbox"
              v-model="config.shownews"
              @change="updateConfig()"
          /></span>
          <div>
            <span>Keep:</span>
            <input
              type="input"
              style="max-width: 40px"
              min="0"
              max="200"
              v-model.number="config.keepNewsCount"
              @change="updateConfig()"
            />
          </div>
        </div>
        <div style="max-height: 50vh; overflow: auto" v-if="config.shownews">
          <ul style="border: 1px solid #ccc; padding: 5px">
            <li
              v-for="(rss, i) in config.rsss"
              :key="rss.url"
              @click="rssIndex = i"
            >
              <div>
                <div>
                  <div style="display: flex">
                    <a style="flex-grow: 1">{{ i }} {{ rss.name }}</a>
                    <input
                      type="checkbox"
                      v-model="rss.enable"
                      @change="updateConfig()"
                    />
                  </div>

                  <div
                    style="
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      overflow: hidden;
                    "
                  >
                    <span>{{ rss.url }}</span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
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
          <select v-model="config.autoSound" @change="updateConfig()">
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
          Back play:
          <input
            style="width: 40px"
            v-model.number="config.backplay"
            min="0"
          />s
        </div>
        <div>
          waitTimes:
          <input
            style="width: 40px"
            v-model.number="config.waitTimes"
            min="0"
          />
        </div>
        <div>
          Dock List:<input
            v-model="config.dockList"
            type="checkbox"
            @change="updateConfig()"
          />
        </div>
        <div>
          custCue:<a
            @click="
              config.custCue = ++config.custCue > 2 ? 0 : config.custCue;
              updateConfig();
            "
            >{{
              config.custCue == 0
                ? "NO"
                : config.custCue == 1
                ? "Bottom"
                : "Top"
            }}
            {{ config.custCue }}
          </a>
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
    (async () => {
      let rconfig = {};

      that.timer = setInterval(() => {
        if (document.readyState === "complete") {
          window.clearInterval(that.timer);

          let reqId = +new Date();
          service(null, { cmd: "getConfig", reqId: ++reqId }, (resp) => {
            if (!resp) return;
            let config = Object.assign(this.config, resp, rconfig);

            let rss = config.rsss;

            let rssmap = !resp.rsss
              ? {}
              : resp.rsss.reduce((map, item) => {
                  map[item.name] = item.enable;
                  return map;
                }, {});
            rss.forEach((element) => {
              element.enable = rssmap[element.name] ? 1 : 0;
            });

            let urls = config.urls;

            let map = {};
            if (resp.urls) {
              for (let k of Object.keys(resp.urls)) {
                for (let j of resp.urls[k]) {
                  map[j.url] = j.enable;
                }
              }
            }
            for (let k of Object.keys(urls)) {
              for (let j of urls[k]) {
                j.enable = map[j.url] ? 1 : 0;
              }
            }

            console.log(urls);
            Object.assign(config, resp);
            if (rss && rss.length) {
              Object.assign(config, { rsss: rss, urls: urls });
            }

            this.$store.commit("config", config);
            console.log(resp);
            this.loadmodsdata().then(() => {
              this.refresh();
            });
          });

          service(
            null,
            { cmd: "get", name: "user", reqId: ++reqId },
            (resp) => {
              console.error("usr");
              this.tokenMessage = resp;
            }
          );

          service(
            null,
            { cmd: "get", name: "uploadDate", reqId: ++reqId },
            (resp) => {
              this.uploadDate = resp;
            }
          );

          bus.$on("video", (item) => {
            //if (this.$store.videos) this.saveCache("videos", this.$store.videos);
            this.saveCache("video-" + item.vid, item);
          });
          bus.$on("new", (id, content) => {
            //if (this.$store.videos) this.saveCache("videos", this.$store.videos);
            this.saveCache("new-" + id, content);
          });
        }
      }, 1000);
    })();
  },
  mounted() {
    setTimeout(() => {
      if (this.config.autoRefresh) {
        this.refresh(true);
      }
    }, 1000);
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
