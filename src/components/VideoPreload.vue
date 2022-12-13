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
    v-show="false"
  ></video>
</template>

<script>
import Vue from "vue";

import videojs from "video.js";
import "videojs-contrib-hls";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "@silvermine/videojs-airplay/dist/silvermine-videojs-airplay.css";
import bus from "@/bus";
import { getExtra } from "@/config";

require("@silvermine/videojs-airplay")(videojs);

Vue.prototype.$video = videojs;
import { getAAduio } from "@/lib";

export default {
  props: ["isAudio", "preload"],
  data() {
    return {
      player: null,
      nextUrl: "",
      curIndex: 0,
      options: {
        inactivityTimeout: 5000,
        type: "application/x-mpegURL",
        src: "",
        preload: false, //是否预下载，默认为true
        autoplay: true, //是否自动播放（兼容性不太好），默认为false
        muted: true,
        isLoop: false, //是否循环，默认不循环
        playsinline: true, //h5是否行内播放，默认false，有兼容性问题
        controls: "progress,current,durration,volume",
        crossOrigin: false, //设置视频的 CORS 设置。
        textTrackDisplay: true,
        playbackRates: [0.7, 0.8, 0.9, 1],
        fill: true,
        fluid: true,
      },
    };
  },

  methods: {
    init() {
      if (!this.player) {
        this.player = this.$video(
          this.$refs.videoPlayer,
          this.options,
          function () {}
        );

        this.player.on("error", () => {
          this.error();
          //bus.$emit();
        });
      }
    },
    error() {
      if (this.type == 1) {
        if (this.list[this.curIndex]) {
          this.list[this.curIndex].error = 1;
        }

        this.loadItem(
          this.type,
          this.list,
          this.list.length > this.curIndex + 1 ? 0 : this.curIndex + 1
        );
      }
    },
    async loadItem(type, list, index) {
      let item = list[index];
      if (type == 0) return;
      if (!item) return;
      await getExtra(item);
      item.cc && fetch(item.cc);
      let videoUrl = item.url;
      this.curIndex = index;
      this.list = list;
      this.type = type;

      console.log("preload");
      if (1 || this.isAudio == "A") {
        for (let i = index; i < list.length; i++) {
          try {
            let res = await getAAduio(list[i], this.isAudio);

            videoUrl = res[0];
            list[i].a = res[0];
            break;
          } catch (e) {
            console.error(e);
          }
        }
      }

      this.nextUrl = videoUrl;

      let url = videoUrl;
      if (url) {
        let filetype = "audio/mpeg";
        if (url.indexOf(".m3p") > -1) {
          filetype = "audio/mp3";
        } else if (url.indexOf(".mp4") > -1) {
          filetype = "video/mp4";
        } else if (url.indexOf("m3u8") > -1) {
          filetype = "application/x-mpegURL";
        } else if (url.indexOf(".mpd") > -1) {
          filetype = "application/dash+xml";
        }
        this.player.src([
          {
            src: videoUrl,
            type: filetype,
          },
        ]);
        this.player.play();
      }
    },
  },
  mounted() {
    bus.$on("nVideoId", (type, list, index) => {
      this.type = type;
      if (this.type == 1)
        setTimeout(() => {
          if (this.preload) {
            this.loadItem(type, list, index);
          }
        }, 10000);
      else {
        this.player.pause();
      }
    });

    bus.$on("pause", () => {
      this.player.pause();
    });
    bus.$on("play", () => {
      if (this.type == 1) this.player.play();
    });
    this.$nextTick(() => {
      this.init();
    });
  },

  watch: {
    isAudio() {
      this.loadItem(this.type, this.list, this.curIndex);
    },
    preload(y) {
      if (!y) this.player.pause();
      else this.player.play();
    },
  },
};
</script>

<style scoped>
.video-js ::cue {
  font-size: 1.5em;
  width: 90%;
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
  font-size: 2.5em;
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
}
.vjs-paused .vjs-big-play-button,
.vjs-paused.vjs-has-started >>> .vjs-big-play-button {
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
</style>
