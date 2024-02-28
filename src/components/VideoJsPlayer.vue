<template>
  <div>
    <video v-for="i in config.playerNum" ref="videoPlayer" x5-playsinline preload="auto" webkit-playsinline="true"
      playsinline="true" x-webkit-airplay="allow" airplay="allow" controls
      class="video-js vjs-default-skin vjs-big-play-centered vjs-16-9" poster="" autoplay="false"
      :title="hovering ? '' : title" @mouseover="hovering = true" @mouseout="hovering = false" :id="i" :key="i"></video>

    <audio v-show="false" ref="keeplive" @ended="keepOnLive()" controls
    :src="audio"
      >
    </audio>

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
import audio from '@/assets/silence.mp3';
//src="data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"

import $ from 'jquery';
import bus from "@/bus";
Vue.prototype.$video = videojs;

const timeout = 10000;

export default {
  props: ["source", "cc", "title", "mediaItem", "timeupdate", "preloadNextUrl"],
  data() {
    return {
      audio:audio,
      maxBitRate: false,
      curPlayIndex: 0,
      activeIndex: 0,
      nextIndex: 1,
      debugStr: '',
      hovering: false,
      players: null,
      options: {
        inactivityTimeout: 5000,
        userActive: 2000,
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

    keepOnLive() {
      if (this.config.isAudio)
        this.playNextVideo();
    },
    bufferNext(player) {
      (async () => {
        let [idx, nextUrl] = await this.getNextPlayUrl(this.curPlayIndex);
        if (nextUrl) {
          player.idx = idx;
          this.setMediaUrl(nextUrl, player);
          player.play();
        }

      })();
    },
    isStuck(player) {
      if (player.currentTime() > player.duration()) return true;
      let buf = player.buffered();
      if (buf.length > 0 && buf.end(buf.length - 1) > 0) {
        return player.currentTime() > buf.end(buf.length - 1);
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
          this.curPlayIndex = nextIndex;
          return [nextIndex, await this.getItemUrl(nextItem)];
        } catch (err) {
          console.error(err);
          continue;
        }
      }
      return [0, 0];
    },
    toInt(value) {
      try {
        return parseInt(value);
      } catch (e) {
        return '';
      }
    },

    async playListVideo(n) {
      

        if (n < 0) return;
        let players = this.players;
        let playList = this.config2.playList;
        let item = playList[n];
        if (!item) return;
        console.log(this.config2.mediaTypeText);
        let url = '';
        try {
          url = await this.getItemUrl(item);
          navigator.mediaSession.metadata = new window.MediaMetadata({
            title: item.title,
            artist: this.config2.mediaTypeText,
            album: this.config2.mediaTypeText,
            artwork: [
              { src: 'icon.png', sizes: '32x32', type: 'image/png' },
            ],
          });

        } catch (err) {
          console.error(err);
        }



        if (!url) this.playNextVideo();

        this.activeIndex = players.map(e => e.url).indexOf(url);

        console.log(this.activeIndex);
        if (this.activeIndex == -1) {
          this.activeIndex = 0;
          this.curPlayIndex = n;
          players.map(e=>e.idx=-1);
          players[this.activeIndex].idx = n;

        }
        let actviePlayer = players[this.activeIndex];
        window.players = this.players;
        document.querySelectorAll('.video-js')[this.activeIndex].style.display = '';
        for (let i = 0; i < this.players.length; i++) {
          if (i != this.activeIndex) {

            if (this.players[i].idx && this.players[i].idx - n > 0 && this.players[i].idx - n < this.players.length) {
              console.log(i, '=>', this.players[i].idx, n, "skip")
              continue;
            }

            let [nidx, nextUrl] = await this.getNextPlayUrl(this.curPlayIndex);
            if (nextUrl) {
              this.players[i].idx = nidx;
              console.error(i, '=>next nidx:' + nidx);
              console.error('next nidx:' + nidx);
              await this.setMediaUrl(nextUrl, this.players[i]);
              this.players[i].actived = false;
              this.players[i].play();
            }

            document.querySelectorAll('.video-js')[i].style.display = this.config.dev ? '' : 'none';
          }
        }
        this.$refs.keeplive.style.display = this.config.dev ? '' : 'none';


        this.$emit("initPlayer", actviePlayer);
        window.player = actviePlayer;

        actviePlayer.muted(false);
        actviePlayer.actived = true;

        await this.setMediaUrl(url, actviePlayer);
        if (!this.$refs.keeplive.inited) {
          this.$refs.keeplive.play();
          this.$refs.keeplive.inited = true;
        }
        try {
          if (actviePlayer.paused())
            actviePlayer.currentTime(0);

          actviePlayer.play();
        } catch (eror) {
          console.error(eror)
        }

    },

    async getItemUrl(item) {

      await getAndPrepareNextExtra(item, this.config2.mediaType);
      console.log('getItemUrl', this.config2.mediaType, item);
      if (this.config.isAudio != 0) {
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
      if (player.timer) {
        clearTimeout(player.timer);
      }

      player.timer = setTimeout(() => {
        console.error('time out');
        if (player.actived) {
          this.playNextVideo();
        }
      }, 5000);
      player.endTimer && clearTimeout(player.endTimer);
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
    playNextVideo(ended) {


      if(!ended && this.players[this.activeIndex].paused()){
        return;
      }
      if (!ended && this.config.isAudio && !this.players[this.activeIndex].paused()) {

        try{
          this.$refs.keeplive.currentTime = 0;
          this.$refs.keeplive.play();
        }catch(eeee){
          console.error(eeee);
        }

        if (this.players[this.activeIndex].readyState() < 3) {

          try {
            this.players[this.activeIndex].play();
          } catch (error) {
            console.error(error);
          }

          if (!this.$refs.keeplive.tryTime) this.$refs.keeplive.tryTime = new Date().getTime();
          let time = (new Date().getTime() - this.$refs.keeplive.tryTime) / 1000;
          let title = 'keep live[' + time + '] ' + new Date();

          $(this.$refs.keeplive).attr('title', title);

          if (time < timeout / 1000)
            return;
        } else {
          try {
            this.players[this.activeIndex].play();
          } catch (error) {
            console.error(error);
          }

          return;
        }
        this.$refs.keeplive.tryTime = 0;
      }


      let sort = this.players.map((e, i) => [i, e.idx]).sort((a, b) => a[1] - b[1]);

      if(sort.length<=1){
        bus.$emit("end", 0, 0, this.players[this.activeIndex].idx);
        return;
      }
      this.nextIndex = sort[sort.length>1?1:0][0];

      [this.nextIndex, this.activeIndex] = [this.activeIndex, this.nextIndex];

      this.players[this.nextIndex].actived = false;
      this.players[this.activeIndex].actived = true;
      let p = this.players[this.activeIndex];
      p.currentTime(0);
      p.muted(false);
   
      this.players[this.nextIndex].muted(true);


      document.querySelectorAll('.video-js')[this.nextIndex].style.display = '';
      document.querySelectorAll('.video-js')[this.activeIndex].style.display = this.config.dev ? '' : 'none';

      this.$refs.keeplive.style.display = this.config.dev ? '' : 'none';

      p.play();

      this.$emit("initPlayer", p);
      bus.$emit("end", 0, 0, this.players[this.activeIndex].idx-1);

    },
    init() {
      let self = this;


      if (!this.players) {

        this.players = this.$refs.videoPlayer.map((video, index) => {


          let player = this.player = this.$video(
            video,
            this.options,

            function () {
              player.index = index;
              let tts = this.textTracks();

              let handler = () => {
                if (!player.actived) return;
                for (let i = 0; i < tts.length; i++) {
                  let track = tts[i];
                  if (track.mode == "showing" && track.kind == "captions") {
                    //track.removeEventListener(this.cuechange);
                    if (!track.cuechange) {
                      track.addEventListener("cuechange", () => {
                        if (!player.actived) return;
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
                      tts[d].mode = self.cc && tts[d].label == "new word" && player.actived ? "showing" : "disabled";
                    if (tts[d].label == "new word") break;
                  }
                }, 5000);
              });
            }
          );
          player.on("loadeddata", () => {
            this.config.isAudio == 0 && setTimeout(() => {

              if (this.config.maxBitRate) {

                var levels = player.qualityLevels();
                var maxBitrate = 0;
                var maxLevel = null;

                for (var i = 0; i < levels.length; i++) {
                  var level = levels[i];
                  level.enabled = false;
                  if (level.bitrate > maxBitrate) {
                    maxBitrate = level.bitrate;
                    maxLevel = level;
                  }
                }

                if (maxLevel) {
                  maxLevel.enabled = true;
                }


              }
            }, 0);


            setTimeout(() => {
              console.error('play ' + player.index);
              let tracks = player.textTracks();
              for (var d = 0; d < tracks.length; d++) {
                console.error(tracks[d].label);

                if (!player.actived || tracks[d].label !== "new word") {
                  console.log('disable ' + player.index + " " + tracks[d].label);
                  tracks[d].mode = "disabled";
                }
              }
            }, 100);

            if (!player.actived) return;
            player.playbackRate(self.config.playbackrate);

          });


          player.on("timeupdate", (e) => {
            if (player.timer) {

              clearTimeout(player.timer);
            }
            if (!player.actived) {
                setTimeout(() => {
                  !player.actived && player.pause();
                }, 0);
              if (player.duration() === Infinity) {
                player.pause();
                return;
              }
              return;
            }

            player.checkTime = player.currentTime();
            player.timer = setTimeout(() => {
              if (!player.paused()&&this.toInt(player.checkTime) === this.toInt(player.currentTime())) {
                  this.playNextVideo(1);
              }
              player.timer = 0;
            }, timeout);
            this.$emit("timeupdate", e, player);
          });

          player.on("useractive", () => {
            this.updateConfig2({ touchstart: 1 });

          });
          player.on("userinactive", () => {
            this.updateConfig2({ touchstart: 0 });
          });

          player.on('stalled', () => {
            player.actived && this.config.isAudio && this.playNextVideo();
          });
          player.on('suspend', () => {
            player.actived && this.config.isAudio && this.playNextVideo();
          });
          player.on('waiting', () => {
            player.actived && this.config.isAudio && setTimeout(() => {
              this.playNextVideo();
            }, 2000);
          });
          player.on("ended", () => {
            if (!player.actived) {
              //player.currentTime(0);
              //setTimeout(() => player.pause(), 10);
              return;
            }
            if (player.endTimer) clearTimeout(player.endTimer);
            this.playNextVideo(1);
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
            if (player.endTimer) clearTimeout(player.endTimer);

          });

          player.on("play", () => {


            if (!player.actived) return;
            this.$emit("play");
            bus.$emit("play");
            this.updateConfig2({ playingM: 1 });


          });

          player.on("playing", () => {


            if (!player.actived) return;

            if (player.endTimer) clearTimeout(player.endTimer);
            if (this.config.isAudio && player.duration() != Infinity) {
              player.endTimer = setTimeout(() => {
                if (!player.paused()) {
                  this.playNextVideo(1);
                }
              }, (player.duration() - player.currentTime()) * 1000);
            }

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
      setTimeout(()=>{
        this.init();
      },1000);
    
    });
    console.log('dev', this.config.dev);

  },

  watch: {

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
        document.querySelectorAll('.video-js')[this.nextIndex].style.display = n ? '' : 'none';
        this.$refs.keeplive.style.display = n ? '' : 'none';
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
