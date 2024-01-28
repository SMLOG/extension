<template>
  <div >
  <video ref="videoPlayer" x5-playsinline preload="auto" webkit-playsinline="true" playsinline="true" x-webkit-airplay="allow"
    airplay="allow" controls  class="video-js vjs-default-skin vjs-big-play-centered vjs-16-9" poster=""
    autoplay="false" :title="hovering?'':title"    @mouseover="hovering = true" @mouseout="hovering = false" muted ></video>

    <video ref="bufferPlayer" x5-playsinline preload="auto" webkit-playsinline="true" playsinline="true" x-webkit-airplay="allow"
    airplay="allow" controls  class="video-js vjs-default-skin vjs-big-play-centered vjs-16-9" poster=""
    autoplay="false" :title="hovering?'':title"    @mouseover="hovering = true" @mouseout="hovering = false" muted></video>


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

import bus from "@/bus";

Vue.prototype.$video = videojs;


export default {
  props: ["source", "cc", "title", "mediaItem", "timeupdate", "preloadNextUrl"],
  data() {
    return {
      hovering:false,
      players:null,
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

    playListVideo(n){
           /// getAndPrepareNextExtra
           (async()=>{
        let players = this.players;
        let playList = this.config2.playList;
        let item = playList[n];
        if(!item)return;
        let nextIndex = Math.min(playList.length,n+1)==playList.length?0:n+1;
        let nextItem = playList[nextIndex];
       let url = '';
       try{
        url = await this.getItemUrl(item);
       }catch(err){
        console.error(err);
       }
       let nextUrl = '';
       try{
       nextUrl = await this.getItemUrl(nextItem);
       }catch(err){
        console.error(err);
       }
       if(!url)this.playNextVideo();

       let activeIndex= players.map(e=>e.url).indexOf(url);
       let bufferIndex= players.map(e=>e.url).indexOf(nextUrl);
       console.log(activeIndex,bufferIndex,url,nextUrl);

       
        activeIndex = activeIndex>-1?activeIndex:activeIndex<0&&bufferIndex<0?0:bufferIndex<0?1:1-bufferIndex;
        bufferIndex = 1-activeIndex;

        


        let bufferPlaery = players[bufferIndex];
        bufferPlaery.muted(true);
        bufferPlaery.actived=0;
        bufferPlaery.url=nextUrl;
        if(nextUrl){
          await this.setMediaUrl(bufferPlaery.url,bufferPlaery);
        }
        bufferPlaery.preload('none');
        setTimeout(()=>{bufferPlaery.pause();},6000);
        


        let actviePlayer = players[activeIndex];

        this.$emit("initPlayer", actviePlayer);
        window.player = actviePlayer;

        actviePlayer.muted(false);
        actviePlayer.actived=1;
        actviePlayer.url=url;

        await this.setMediaUrl( actviePlayer.url,actviePlayer);
        setTimeout(()=>{
          actviePlayer.currentTime(0);
          try{
            actviePlayer.play();
          }catch(eror){
              console.error(eror)
          }
        },100);


        
   
        window.players=players;
            console.log('devvv',this.config.dev)
          document.querySelectorAll('.video-js')[activeIndex].style.display='';
          document.querySelectorAll('.video-js')[bufferIndex].style.display=this.config.dev?'':'none';
        



       })();
    },

   async getItemUrl(item){

        await getAndPrepareNextExtra(item, this.config2.mediaType);
        console.log('getItemUrl',this.config2.mediaType,item);
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
    async setMediaUrl(url,player) {
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
      }
    },
    playNextVideo() {
      this.$emit('ended');
    },
    async bufferNextVideo() {
        
      for(let i=0,bfs=this.players.filter(e=>!e.actived);i<bfs.length;i++){
        let bufferPlayer = bfs[i];
        console.log('start bufferNextVideo' , bufferPlayer.url)
        bufferPlayer.preload('auto');
        bufferPlayer.play();
      }

    },
    init() {
      let self = this;


      if (!this.players) {

        this.players = [this.$refs.videoPlayer,this.$refs.bufferPlayer].map((video)=>{
          
          
          let player = this.player = this.$video(
            video,
          this.options,

          function () {
            let tts = this.textTracks();

            let handler = () => {
              if(!player.actived)return;
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
          if(!player.actived)return;
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
          if(!player.actived){
            return;
          }
          this.$emit("timeupdate", e, player);

        });

        player.on('progress',  ()=> {
          console.log('progress',player.actived)
          if(!player.actived)return;
          var buffered = player.buffered();
          var duration = player.duration();
          if (duration>0 && buffered.length > 0 && buffered.end(buffered.length - 1) === duration) {
            // The video has fully buffered
            console.log('Video has fully buffered. Ready to start buffering next video.');
            // Start buffering the next video
            this.bufferNextVideo();
          } else {
            // The video is still buffering or partially buffered
            console.log('Video is buffering. Please wait...',player.bufferedPercent());

          }
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
          if(!player.actived)return;
          this.playNextVideo();
        });
        player.on("error", (err) => {
          console.error(err);
          setTimeout(() => {
            if(!player.actived)return;
            this.$emit("error", 1);
          }, 0);
        });

        player.on("pause", () => {
          if(!player.actived)return;
          this.$emit("pause");
          bus.$emit("pause");
          this.updateConfig2({ playingM: 0 })
        });

        player.on("play", () => {
          if(!player.actived)return;
          this.$emit("play");
          bus.$emit("play");
          this.updateConfig2({ playingM: 1 })
        });

        player.on("ratechange", () => {
          console.log("change rate");
          if(!player.actived)return;
          if (player.currentTime() > 1) {
            this.updateConfig({ playbackrate: player.playbackRate() })
          }
        });
        return player;
        });
  
        this.$emit("initPlayer", this.players[0]);

        var bufferPlayCount = 0;
        setInterval(()=>{
          let activeList = this.players.filter(e=>e.actived);
          if(!activeList.length)return;
         let  player= activeList[0];

          var buffered = player.buffered();
          if (buffered.length > 0) {
            var lastBufferedIndex = buffered.length - 1;
            var bufferedEnd = buffered.end(lastBufferedIndex);
            var currentTime = player.currentTime();
            if (currentTime>0 && currentTime<player.duration()-1&&currentTime >= bufferedEnd) {
              bufferPlayCount++;
              if (bufferPlayCount > 3) {
                bufferPlayCount=0;
                this.playNextVideo();
              } else {
                var bufferedStart = buffered.start(lastBufferedIndex);
                player.currentTime(Math.max(bufferedStart,bufferedEnd-10));
                player.play();
              }
            }else{
              bufferPlayCount = 0;
            }
          }
        },2000);
        


      }
    
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.init();
    });
    console.log('dev',this.config.dev);

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

    source() {
      console.log("preloadNextUrl:",this.preloadNextUrl)
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
</style>
