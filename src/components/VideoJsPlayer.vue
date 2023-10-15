<template>
  <video
    x5-playsinline
    preload="auto"
    webkit-playsinline="true"
    playsinline="true"
    x-webkit-airplay="allow"
    airplay="allow"
    controls
    ref="videoPlayer"
    class="video-js vjs-default-skin vjs-big-play-centered vjs-16-9"
    poster=""
    autoplay="false"
    :title="title"
  ></video>
</template>

<script>
//import { vplayer } from "vue-hls-player";
import Vue from "vue";

import videojs from "video.js";
import "videojs-contrib-hls";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "@silvermine/videojs-airplay/dist/silvermine-videojs-airplay.css";

require("@silvermine/videojs-airplay")(videojs);
import bus from "@/bus";

Vue.prototype.$video = videojs;

export default {
  props: ["source", "cc", "title", "mediaItem", "timeupdate"],
  data() {
    return {
      player: null,
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
        playbackRates: [0.7, 0.8, 0.9, 1, 2, 3, 4, 5],
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
  created() {},
  computed: {},
  /*updated() {
    this.$nextTick(() => {
      this.init();
    });
  },*/
  methods: {
    init() {
      let player = this.player;
      let self = this;

      //this.$refs.videoPlayer.setAttribute("title", this.title);
      //alert(this.title);
      if (!this.player) {
        player = this.player = this.$video(
          this.$refs.videoPlayer,
          this.options,

          function () {
            let tts = this.textTracks();

            let handler = () => {
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
          player.playbackRate(sessionStorage.playbackrate);
          setTimeout(() => {
            let tracks = player.textTracks();
            for (var d = 0; d < tracks.length; d++) {
              console.error(tracks[d].label);

              if (tracks[d].label !== "new word") tracks[d].mode = "disabled";
            }
          }, 0);
        });
        player.on("timeupdate", (e) => {
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

        let lastVolume = 0;
        let lastVolumeTime = 0;
        player.on("volumechange", () => {
          if (new Date().getTime() - lastVolumeTime < 600) {
            this.emit(player.volume() - lastVolume > 0 ? "NEXT" : "PRE");
            player.volume(lastVolume);
          }
          lastVolumeTime = new Date().getTime();
          lastVolume = player.volume();
        });

        this.$emit("initPlayer", player);
        window.player = player;

        player.on("ended", () => {
          // document.querySelector("video").currentTime = 0;
          // player.play();
          let item = self.mediaItem;
          let session = sessionStorage;
          setTimeout(() => {
            item._d = +new Date();
            let doneVideoMap = session.doneVideoMap
              ? JSON.parse(session.doneVideoMap)
              : {};

            doneVideoMap[item.vid] = item._d;

            session.doneVideoMap = JSON.stringify(doneVideoMap);
          }, 1000);

          this.$emit("ended");
        });
        player.on("error", (err) => {
          //this.$emit("error");
          /* setTimeout(() => {
            if (!player.paused()) this.$emit("ended");
          }, 2000);*/

          console.error(err);
          setTimeout(() => {
            this.$emit("error", 1);
          }, 0);
        });

        player.on("pause", () => {
          this.$emit("pause");
          bus.$emit("pause");
         this.updateConfig2({playingM:0})
        });

        player.on("play", () => {
          this.$emit("play");
          bus.$emit("play");
          this.updateConfig2({playingM:1})
        });

        player.on("ratechange", () => {
          console.log("change rate");
          if (player.currentTime() > 1) {
            sessionStorage.playbackrate = player.playbackRate();
            console.log(sessionStorage.playbackrate);
          }
        });
      }
      //let rate = (sessionStorage.playbackrate = player.playbackRate());
      let url = this.source;

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
          fetch(url)
            .then((r) => r.blob())
            .then((r) => {
              this.player.src([
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
          this.player.src([
            {
              src: url,
              type: filetype,
            },
          ]);
      }

      if (player.paused()) this.player.play();

      /* if (rate) {
        setTimeout(() => {
          player.playbackRate(rate);
        }, 1000);
      }*/
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.init();
    });
  },

  watch: {
    source() {
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
.video-js >>> .vjs-text-track-cue u {
  color: lightpink;
}
video::cue(i),
.video-js >>> .vjs-text-track-cue i {
  color: lightblue;
}
.video-js >>> .vjs-loading-spinner {
  width: 2em;
  height: 2em;
  border-radius: 1em;
  margin-top: -1em;
  margin-left: -1.5em;
}

.video-js >>> .vjs-big-play-button {
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
  display: none;

}
.vjs-paused .vjs-big-play-button,
.vjs-paused.vjs-has-started >>> .vjs-big-play-button {
  display: none !important;
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
  display: none !important;
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
.text >>> .cur {
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
>>> .vjs-text-track-display .vjs-text-track-cue * {
  pointer-events: auto;
  user-select: auto;
  z-index: 1;
}
</style>
