<template >
  <vue-aliplayer-v2
    :source="source"
    ref="VueAliplayerV2"
    :options="alioptions"
    @ended="ended"
    :isLive="isLive"
    class="video-js vjs-default-skin vjs-big-play-centered vjs-16-9"
  />
</template>

<script>
import VueAliplayerV2 from "vue-aliplayer-v2";
import "@silvermine/videojs-airplay/dist/silvermine-videojs-airplay.css";
export default {
  props: ["source", "cc", "isLive"],
  data() {
    return {
      alioptions: {
        // source:'//player.alicdn.com/video/aliyunmedia.mp4',
        isLive: 0, //切换为直播流的时候必填
        // format: 'm3u8'  //切换为直播流的时候必填
        useH5Prism: 1,
        playsinline: 1,
        useHlsPluginForSafari: 1,
        // height: "400px",
      },
    };
  },
  created() {},
  computed: {},
  components: { VueAliplayerV2 },

  updated() {
    this.$nextTick(() => {
      this.init();
    });
  },
  methods: {
    init() {
      this.alioptions.isLive = this.isLive;
    },
    ended() {
      this.$emit("ended");
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
  },
};
</script>

<style scoped>

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

