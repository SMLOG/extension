<template>
  <div>
    <div v-show="config.dev && players && players.length > 0" style="position: absolute;
    top: 0;
    z-index: 10000;
    background: rgba(255,255,255,0.6);
    text-align: center;
    width: 100%;">
      <div>{{ flushTime }}</div>
      <div v-if="players">
        <div v-for="(info, ik) in  infos" :key="ik" :class="{ active: info.active }">
          #{{ ik }}: {{ info.active }}
          {{ info.currentTime.toFixed(2) }}/<span
            :class="{ buffered: toInt(info.lastBufferEnd) == toInt(info.duration) }">{{
              toInt(info.lastBufferEnd) }}/{{ toInt(info.duration) }}</span>
              <span>wt:{{ info.waitTimes }}</span>
          <br />
        </div>
      </div>
      {{ bufferNextStarted }}
      <br />
      {{ debugStr }}
      <br />
    </div>
    <video ref="videoPlayer" x5-playsinline preload="auto" webkit-playsinline="true" playsinline="true"
      x-webkit-airplay="allow" airplay="allow" controls class="video-js vjs-default-skin vjs-big-play-centered vjs-16-9"
      poster="" autoplay="false" :title="hovering ? '' : title" @mouseover="hovering = true"
      @mouseout="hovering = false"></video>

    <video ref="bufferPlayer" x5-playsinline preload="auto" webkit-playsinline="true" playsinline="true"
      x-webkit-airplay="allow" airplay="allow" controls class="video-js vjs-default-skin vjs-big-play-centered vjs-16-9"
      poster="" autoplay="false" :title="hovering ? '' : title" @mouseover="hovering = true"
      @mouseout="hovering = false"></video>



  </div>
</template>

<script>
//import { vplayer } from "vue-hls-player";
import Vue from "vue";

import videojs from "video.js";
//import "videojs-playlist";
import "videojs-contrib-hls";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "@silvermine/videojs-airplay/dist/silvermine-videojs-airplay.css";
import { getAndPrepareNextExtra } from "@/config";
import { getAAduio } from "@/lib";
require("@silvermine/videojs-airplay")(videojs);

import $ from 'jquery';
import bus from "@/bus";
Vue.prototype.$video = videojs;


export default {
  props: ["source", "cc", "title", "mediaItem", "timeupdate", "preloadNextUrl"],
  data() {
    return {
      curPlayIndex: 0,
      activeIndex: 0,
      bufferIndex: 1,
      debugStr: '',
      bufferNextStarted: '',
      flushTime: '',
      hovering: false,
      players: null,
      infos: [
        { active: false, currentTime: 0, duration: 0, bufferedEnd: 0, lastBufferEnd: 0, waitTimes: 0 },
        { active: false, currentTime: 0, duration: 0, bufferedEnd: 0, lastBufferEnd: 0, waitTimes: 0 }
      ],
      options: {
        inactivityTimeout: 5000,
        userActions: {
          hotkeys: function (event) {
            // `this` is the player in this context

            // `x` key = pause
            if (event.which === 88) {
              this.pause();
            }
            // `y` key = play
            if (event.which === 89) {
              this.play();
            }
          },
        },
        type: "application/x-mpegURL",
        src: "",
        preload: true, //是否预下载，默认为true
        autoplay: false, //是否自动播放（兼容性不太好），默认为false
        isLoop: false, //是否循环，默认不循环
        playsinline: true, //h5是否行内播放，默认false，有兼容性问题
        // poster: "https://oimdztrab.qnssl.com/Frp4SyVe5PosdkUKRaE-krjK7B5z", //封面，仅视频有
        controls: "progress,current,durration,volume",
        crossOrigin: false, //设置视频的 CORS 设置。
        textTrackDisplay: true,
        playbackRates: [0.5, 0.6, 0.7, 0.8, 0.9, 1],
        fill: true,
        fluid: true,
        plugins: {
          airPlay: {
            addButtonToControlBar: true, // defaults to `true`
          },
        },
        html5: {
          vhs: {
            overrideNative: false,
          },
          hls: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: false,
          },
          nativeVideoTracks: true,
          nativeAudioTracks: true,
          // nativeTextTracks: true,
        },
      },
    };
  },
  created() { },
  computed: {},
  /*updated() {
    this.$nextTick(() => {
      this.init();
    });
  },*/
  methods: {

    bufferNext(player) {
      (async () => {
        let nextUrl = await this.getNextPlayUrl(++this.curPlayIndex);
        this.bufferNextStarted = "buffer error switch:" + this.curPlayIndex + " " + nextUrl;
        this.setMediaUrl(nextUrl, player);
        player.play();
      })();
    },
    isStuck(player) {
      if( player.currentTime()> player.duration())return true;
      let buf = player.buffered();
      if (buf.length > 0) {
        return player.currentTime() > 3 && player.currentTime() > buf.end(buf.length - 1);
      }
      return false;

    },
    async getNextPlayUrl(n) {
      let nextIndex = n;
      let playList = this.config2.playList;
      for (let k = 0; k < playList.length; k++) {
        try {
          nextIndex = nextIndex + 1;
          nextIndex = Math.min(playList.length, nextIndex) == playList.length ? 0 : nextIndex;
          let nextItem = playList[nextIndex];
          return await this.getItemUrl(nextItem);
        } catch (err) {
          console.error(err);
          continue;
        }
      }
      return '';
    },
    toInt(value) {
      try {
        return parseInt(value);
      } catch (e) {
        return '';
      }
    },
    getCurrentTime() {
      var currentDate = new Date();
      var formattedTime = currentDate.toTimeString().slice(0, 8);
      return formattedTime;
    },

    smoothCheck(player) {

      var buffered = player.buffered();

      var duration = player.duration();

      if (duration > 0 && buffered.length > 0) {
        if (
          this.toInt(buffered.end(buffered.length - 1)) + 2 >= this.toInt(duration)
        ) {
          this.startBufferNext();
        }
      }
    },
    playListVideo(n) {
      if (n < 0) return;

      (async () => {
        let players = this.players;
        let playList = this.config2.playList;
        let item = playList[n];
        if (!item) return;
        let url = '';
        try {
          url = await this.getItemUrl(item);
        } catch (err) {
          console.error(err);
        }
        this.curPlayIndex = n;
        let nextUrl = await this.getNextPlayUrl(n);


        if (!url) this.playNextVideo();

        this.activeIndex = players.map(e => e.url).indexOf(url);
        this.bufferIndex = players.map(e => e.url).indexOf(nextUrl);
        console.log(this.activeIndex, this.bufferIndex, url, nextUrl);
        this.activeIndex = this.activeIndex > -1 ? this.activeIndex : this.activeIndex < 0 && this.bufferIndex < 0 ? 0 : this.bufferIndex < 0 ? 1 : 1 - this.bufferIndex;
        this.bufferIndex = 1 - this.activeIndex;

        let bufferPlaery = players[this.bufferIndex];
        let actviePlayer = players[this.activeIndex];

        window.players = players;
        document.querySelectorAll('.video-js')[this.activeIndex].style.display = '';
        document.querySelectorAll('.video-js')[this.bufferIndex].style.display = this.config.dev ? '' : 'none';
        bufferPlaery.actived = 0;
        if (nextUrl) {
          await this.setMediaUrl(nextUrl, bufferPlaery);
        }

        this.$emit("initPlayer", actviePlayer);
        window.player = actviePlayer;

        actviePlayer.muted(false);
        actviePlayer.actived = 1;

        await this.setMediaUrl(url, actviePlayer);
        if (actviePlayer.muted()) {
          actviePlayer.currentTime(0);
          try {
            actviePlayer.play();
          } catch (eror) {
            console.error(eror)
          }
        }


      })();
    },

    async getItemUrl(item) {

      await getAndPrepareNextExtra(item, this.config2.mediaType);
      console.log('getItemUrl', this.config2.mediaType, item);
      if (this.config2.mediaType == 1) {
        try {
          if (item.audio == undefined) {
            try {
              await getAAduio(item);
            } catch (eee) {
              console.log(eee);
            }
          }
          console.log(this.config.isAudio);
          if (this.config.isAudio) {
            if (!item.audio) throw "no audio";
            return item.audio + "?_=" + this.config2.mediaType;
          }


        } catch (e) {
          console.error(e);
          throw e;
        }
      }
      return item.url;

    },
    async setMediaUrl(url, player) {
      console.log(url);
      player.checkTime = 0;
      if(player.timer){
        clearTimeout(player.timer);
      }
      player.timer = 0;
      player.waitTimes = 0;
      if (player.url === url) return;
      if (url) {
        let filetype = "audio/mpeg";
        if (url.indexOf(".m3p") > -1) {
          filetype = "audio/mp3";
        } else if (url.indexOf(".m4a") > -1) {
          filetype = "audio/mp4";
        } else if (url.indexOf(".mp4") > -1) {
          filetype = "video/mp4";
        } else if (url.indexOf("m3u8") > -1) {
          filetype = "application/x-mpegURL";
        } else if (url.indexOf(".mpd") > -1) {
          filetype = "application/dash+xml";
        }

        console.error(url, filetype);
        if (url.indexOf("/cache/local") > -1) {
          await fetch(url)
            .then((r) => r.blob())
            .then((r) => {
              player.src([
                {
                  src: window.URL.createObjectURL(r),
                  type: filetype,
                },
              ]);
              //  const reader = new FileReader();
              //   reader.readAsDataURL(r);
              //  reader.onload = () => {console.error(reader.result)};
            });
        } else
          player.src([
            {
              src: url,
              type: filetype,
            },
          ]);
        player.url = url;
      }
    },
    playNextVideo() {
      let wt = this.players[this.bufferIndex].waitTimes || 0;

      if(wt<this.config.waitTimes){
      this.players[this.bufferIndex].currentTime(0);
      if (this.players[this.bufferIndex].readyState() < 1) {
        if (wt < this.config.waitTimes) {
          this.players[this.bufferIndex].waitTimes = 0;
          this.players[this.activeIndex].currentTime(0);
          if (this.players[this.activeIndex].readyState() > 0) {
            this.players[this.activeIndex].play();
            this.bufferNext(this.players[this.bufferIndex]);
            return;
          }
        }

        this.players[this.bufferIndex].waitTimes = ++wt;

      }
    }
    this.players[this.bufferIndex].waitTimes=0;

      this.players[this.activeIndex].actived = false;

      this.players[this.bufferIndex].actived = true;

      [this.bufferIndex, this.activeIndex] = [this.activeIndex, this.bufferIndex];

      let p = this.players[this.activeIndex];

      p.currentTime(0);
      p.muted(false);
      document.querySelectorAll('.video-js')[this.bufferIndex].style.display = '';
      document.querySelectorAll('.video-js')[this.activeIndex].style.display = this.config.dev ? '' : 'none';


      p.play();
      bus.$emit("end", 0, 0, this.curPlayIndex);

    },
    async startBufferNext() {

      for (let i = 0, bfs = this.players.filter(e => !e.actived); i < bfs.length; i++) {
        let bufferPlayer = bfs[i];

        bufferPlayer.startBufferTime = 0;
        if (bufferPlayer.paused() && bufferPlayer.startBufferTime < 0) {
          this.bufferNextStarted = 'buffer Next:' + this.getCurrentTime();
          console.log('start startBufferNext', bufferPlayer.url)

          bufferPlayer.preload('auto');
          bufferPlayer.paused() && bufferPlayer.play();
        }

      }

    },
    init() {
      let self = this;


      if (!this.players) {

        this.players = [this.$refs.videoPlayer, this.$refs.bufferPlayer].map((video) => {


          let player = this.player = this.$video(
            video,
            this.options,

            function () {
              let tts = this.textTracks();

              let handler = () => {
                if (!player.actived) return;
                for (let i = 0; i < tts.length; i++) {
                  let track = tts[i];
                  if (track.mode == "showing" && track.kind == "captions") {
                    //track.removeEventListener(this.cuechange);
                    if (!track.cuechange) {
                      track.addEventListener("cuechange", () => {
                        track.activeCues[0] &&
                          self.$emit("cuechange", track.activeCues[0], track);
                        // self.cuechange(track.activeCues[0], track);
                      });
                      track.cuechange = 1;
                    }
                    break;
                  }
                }
              };

              ["change", "removtrack", "addtrack"].forEach((e) => {
                tts.addEventListener(e, handler);
              });
              tts.addEventListener("addtrack", () => {
                setTimeout(() => {
                  for (var d = 0; d < tts.length; d++) {
                    if (tts[d].kind == "captions")
                      tts[d].mode = self.cc ? "showing" : "disabled";
                    if (tts[d].label == "new word") break;
                  }
                }, 5000);
              });
            }
          );
          player.on("loadeddata", function () {
            if (!player.actived) return;
            player.playbackRate(self.config.playbackrate);
            setTimeout(() => {
              let tracks = player.textTracks();
              for (var d = 0; d < tracks.length; d++) {
                console.error(tracks[d].label);

                if (tracks[d].label !== "new word") tracks[d].mode = "disabled";
              }
            }, 0);
          });

          player.on("timeupdate", (e) => {
            if (!player.actived) {
              !player.muted() && player.muted(true);
              if (player.duration() === Infinity) {
                player.pause();
                return;
              }
              return;
            }
            if (!player.timer) {
              player.checkTime = player.currentTime();
              if (player.timer) clearTimeout(player.timer);

              player.timer = setTimeout(() => {
                let isStuck = this.isStuck(player) ;
                if (isStuck|| this.toInt(player.checkTime) == this.toInt(player.currentTime())) {
                  console.log(isStuck,this.toInt(player.checkTime),this.toInt(player.currentTime()))
                  if (!player.paused()) {
                    this.playNextVideo();
                  }

                }
                player.timer = 0;
              }, 2000);
            }

            if (this.config.dev) {
              this.flushTime = this.getCurrentTime();
            }
            this.$emit("timeupdate", e, player);
          });

          let tt = 0;
          player.on("touchstart", () => {
            this.updateConfig2({ touchstart: 1 });
            if (tt) clearTimeout(tt);
            tt = 0;
          });
          player.on("touchend", () => {
            tt = setTimeout(() => {
              this.updateConfig2({ touchstart: 0 });
            }, 1000);
          });

          player.on("ended", () => {
            if (!player.actived) return;
            this.playNextVideo();
          });
          player.on("error", (err) => {
            console.error(err);
            if (!player.actived) {
              this.bufferNext(player);
            } else {
              this.playNextVideo();
            }
          });

          player.on("pause", () => {
            if (!player.actived) return;
            this.$emit("pause");
            bus.$emit("pause");
            this.updateConfig2({ playingM: 0 })
          });

          player.on("play", () => {
            if (!player.actived) return;
            this.$emit("play");
            bus.$emit("play");
            this.updateConfig2({ playingM: 1 })
          });

          player.on("ratechange", () => {
            console.log("change rate");
            if (!player.actived) return;
            if (player.currentTime() > 1) {
              this.updateConfig({ playbackrate: player.playbackRate() })
            }
          });
          return player;
        });

        this.$emit("initPlayer", this.players[0]);
      }

    },
  },
  mounted() {


    this.$nextTick(() => {
      this.init();
    });
    console.log('dev', this.config.dev);

  },

  watch: {
    flushTime() {
      this.infos.forEach((e, index) => {
        let p = this.players[index];
        e.active = p.actived;
        e.currentTime = p.currentTime();
        e.duration = p.duration();
        e.waitTimes = p.waitTimes;
        let buffered = p.buffered();

        if (buffered.length > 0) {
          e.lastBufferEnd = buffered.end(buffered.length - 1);
        }

      });
    },
    "$store.state.config.isAudio": {
      handler() {
        setTimeout(() => {
          this.playListVideo(this.config2.playIndex);
        }, 800);
      },
    },
    "$store.state.config2.playIndex": {
      handler(n) {

        this.playListVideo(n);


      },
    },
    "$store.state.config.playbackrate": {
      handler(n) {
        this.player && this.player.playbackRate(n)

      }
    },
    "$store.state.config.dev": {
      handler(n) {
        document.querySelectorAll('.video-js')[this.bufferIndex].style.display = n ? '' : 'none';
        setTimeout(() => {
          $(window).resize();
        }, 100);
      }
    },


    source() {
      console.log("preloadNextUrl:", this.preloadNextUrl)
      this.init();
    },
    title() {
      document.title = this.title;
    },
  },
};
</script>

<style scoped>
.video-js ::cue {
  width: 90%;
  background: rgba(0, 0, 0, 0.8);
}

video::cue(u),
.video-js>>>.vjs-text-track-cue u {
  color: lightpink;
}

video::cue(i),
.video-js>>>.vjs-text-track-cue i {
  color: lightblue;
}

.video-js>>>.vjs-loading-spinner {
  width: 2em;
  height: 2em;
  border-radius: 1em;
  margin-top: -1em;
  margin-left: -1.5em;
}

.video-js>>>.vjs-big-play-button {
  font-size: 3em;
  line-height: 42px !important;
  height: 50px !important;
  width: 50px !important;
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;
  margin-top: -25px !important;
  margin-left: -25px !important;
  padding: 0;
  cursor: pointer;
  opacity: 1;
  border: 0.06666em solid #fff;
  background-color: #2b333f;
  background-color: rgba(43, 51, 63, 0.7);
  border-radius: 50% !important;
  -webkit-transition: all 0.4s;
  transition: all 0.4s;
}

.vjs-paused .vjs-big-play-button,
.vjs-paused.vjs-has-started>>>.vjs-big-play-button {
  display: block !important;
}

.myVideo-dimensions {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
}

.vjs-poster {
  background-size: 100% 100% !important;
}

.vjs-paused .vjs-big-play-button,
.vjs-paused.vjs-has-started .vjs-big-play-button {
  display: block;
}

.top {
  position: fixed;
  background-color: white;
  overflow: scroll;
  width: 100%;
  top: 0;
  right: 0;
  left: 0;
  bottom: 48px;
  overflow: hidden;
  z-index: 10000;
}

/*@media screen and (min-width: 750px) {

}*/
.top {
  max-width: 100vh;
}

.videoCon {
  width: 100%;
}

.text {
  word-break: break-all;
  position: absolute;
  width: 100%;
  bottom: 0px;
  display: block;
  font-size: 24px;
  line-height: 1.5em;
  color: #333;
  word-break: break-word;
  word-wrap: break-word;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;

  padding: 10px 20px 10px 10px;
  overflow: overlay;
  box-sizing: border-box;
  text-align: left;
}

.text>>>.cur {
  color: green;
}

#bts {
  text-align: right;
}

#bts a {
  display: inline-block;
  margin: 0px 0px 5px 5px;
  padding: 6px 8px;
  font-size: 14px;
  outline: none;
  text-align: center;
  line-height: 1em;
  cursor: pointer;
  color: white;
  background-color: rgba(0, 64, 156, 0.8);
  user-select: none;
}

#bts input {
  margin: 0;
  padding: 0;
}

#bts a.enable {
  color: red;
}

>>>.vjs-text-track-display .vjs-text-track-cue * {
  pointer-events: auto;
  user-select: auto;
  z-index: 1;
}

.active {
  color: red;
}

.buffered {
  color: green;
  font-weight: bold;
}
</style>
