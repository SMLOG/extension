<template>
  <div>
    <div v-show="show" ref="top" class="top" :class="'fs-' + fs">
      <div ref="videoCon" class="videoCon" v-show="0 != mediaType">
        <div v-if="!isAliPlayer">
          <VideoJsPlayer
            :source="videoUrl"
            @cuechange="cuechange"
            @initPlayer="initPlayer"
            :cc="cc"
            @ended="end"
            :title="title"
            :mediaItem="item"
            @timeupdate="LseqNext"
          ></VideoJsPlayer>
          <VideoPreload :isAudio="isAudio" :preload="preload" />
        </div>
        <div v-if="isAliPlayer" class="ali">
          <AliPlayer :source="videoUrl" @ended="end" :isLive="mediaType == 3" />
        </div>
      </div>
      <audio
        controls
        style="width: 100%"
        :title="title"
        ref="audio"
        v-show="mediaType == 0"
      />
      <div style="position: relative; z-index: 10000">
        <div :class="{ preload: preload }" id="bts" ref="bts">
          <a
            class="up"
            style="margin-left: 0"
            :class="{ selected: isAutoScroll }"
            @click="isAutoScroll = !isAutoScroll"
          >
            <font-awesome-icon
              v-show="isAutoScroll"
              size="xs"
              icon="fa-solid fa-check"
            />
            {{ top }}</a
          >
          <a class="up" :class="{ selected: isCc }" @click="isCc = !isCc">
            cc</a
          >
          <a class="up" @click="fs >= 4 ? (fs = 1) : fs++"> {{ fs }}</a>
          <a
            class="up"
            :class="{ selected: isAliPlayer }"
            @click="isAliPlayer = !isAliPlayer"
          >
            <font-awesome-icon
              v-show="isAliPlayer"
              size="xs"
              icon="fa-solid fa-check"
            />
            Ali</a
          >
          <a class="loop" :class="{ selected: isBg }" @click="isBg = !isBg">
            <font-awesome-icon
              v-show="isBg"
              size="xs"
              icon="fa-solid fa-check"
            />

            BG</a
          >
          <a class="loop">
            <select v-model="isAudio">
              <option value="">AT</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
            </select>
          </a>

          <a class="loop">
            <select v-model="isLoop">
              <option value="">Seq</option>
              <option value="LSeq">LSeq</option>
              <option value="LSe2">LSe2{{ loopCount }}</option>
              <option value="Loop">Loop</option>
            </select>
          </a>

          <a @click="prev()">
            <font-awesome-icon icon="fa-solid fa-angle-left"
          /></a>

          <a @click="next()">
            <font-awesome-icon icon="fa-solid fa-angle-right"
          /></a>
        </div>
      </div>
      <div ref="text" class="text">
        <a @click="clickUrl(videoUrl)" style="color: blue; cursor: pointer">{{
          title
        }}</a>
        <div v-if="item.src">
          source:<a target="_blank" :href="item.src">{{ item.src }}</a>
          <a v-if="item.org" style="padding-left: 5px">{{ item.org }}</a>
        </div>
        <div v-html="text" ref="lynx"></div>
      </div>
    </div>
    <PlayerControllers :playing="playing" />
  </div>
</template>

<script>
import $ from "jquery";
import { mapState } from "vuex";
import bus from "@/bus";
import { htmlTrans } from "@/HtmlTrans";
import { service } from "@/service";

import PlayerControllers from "../components/PlayerControllers";

import { getAndPrepareNextExtra } from "@/config";
import { getAAduio } from "@/lib";

import "video.js/dist/video-js.css";

import VideoJsPlayer from "./VideoJsPlayer.vue";
import VideoPreload from "./VideoPreload.vue";
import AliPlayer from "./AliPlayer.vue";

export default {
  data() {
    return {
      isAliPlayer: 0,

      fs: 2,
      cc: 0,
      isLoop: "",
      loopCount: 0,
      cueIndex: 0,
      item: {},
      nextItem: {},
      isCc: 0,
      mediaType: 1,
      videoUrl: "",
      show: 0,
      url: "",
      top: "0%",
      player: null,
      videos: null,
      videoId: "",
      videoIndex: 0,
      text: "",
      scrollTimer: 1,
      title: "",
      isAutoScroll: true,
      playing: 0,
      sps: [],
      isBg: 0,
      isAudio: !sessionStorage.isAudio ? "" : sessionStorage.isAudio,
      av: 1,
    };
  },
  created() {},
  computed: {
    ...mapState(["curItem", "words"]),
    preload() {
      return this.$store.state.config.preload;
    },
    dict() {
      return this.$store.state.config.dict;
    },
  },
  components: { PlayerControllers, VideoJsPlayer, AliPlayer, VideoPreload },
  methods: {
    initPlayer(player) {
      this.player = player;
    },
    clickUrl(url) {
      open(url);
    },

    tryCaption2TTV() {
      var map = {};
      //  var arr = [];
      // arr.push("WEBVTT\n");
      let curTrack;
      this.onCuesChangeSync2 = (curCue, track) => {
        if (track.mode == "showing" && track.kind == "captions") {
          if (curTrack != track) {
            // arr.length = 0;
            map = {};
            $(this.$refs.lynx).html("");
          }
          curTrack = track;
          var cues = track.cues;
          var a = [];
          for (var i = cues.length - 1; i >= 0; i--) {
            let cue = cues[i];
            if (map["" + cue.startTime]) break;

            map["" + cue.startTime] = 1;
            let beg = parseInt(cue.startTime);
            let end = parseInt(cue.endTime);
            //console.log(cue.text);
            let t = `<span begin="${beg}" end="${end}">${htmlTrans(
              this.words,
              cue.text,
              false
            ).replace(/^(\s*[A-Z][^A-Z]+)/g, "<br />$1")}</span> `;
            a.unshift(t);
            // console.log(cue.text);
            //  console.log(t);
            // window.htmlTrans = htmlTrans;
          }
          if (a.length > 0) {
            //arr.push(...a);
            this.cues = $(this.$refs.lynx).append(a.join("\n")).find("span");
          }
        }
      };
    },
    LseqNext(event, player) {
      if (
        (this.isLoop == "LSeq" || this.isLoop == "LSe2") &&
        player &&
        player.duration() - player.currentTime() < 1 &&
        !this.loadingNext
      ) {
        this.loadingNext = 1;
        setTimeout(() => {
          console.error("next");
          if (this.isLoop == "LSe") {
            this.loopCount = 0;
            this.next();
          } else if (this.isLoop == "LSe2") {
            this.loopCount++;
            if (this.loopCount >= 2) {
              this.loopCount = 0;
              this.next();
            }
          }

          setTimeout(() => {
            this.loadingNext = 0;
          }, 10000);
        }, 1000);
      }
    },
    scroll(clear) {
      clearInterval(this.scrollTimer);
      this.onCuesChangeSync = 0;

      if (!this.isAutoScroll || clear) {
        return;
      }

      if (this.cc) {
        //$("span:empty", this.$refs.text).remove();

        if (this.player) {
          this.cueIndex = 0;
          let $text = $(this.$refs.text);
          // $text.find("span").not("[begin]").remove();

          this.cues = $text.find("span");
          $text.find("span").each(function () {
            if (!$(this).text().trim()) $(this).attr("skip", 1);
          });
          this.onCuesChangeSync = () => {
            let sp = this.cues;
            //  console.log("scroll " + new Date().getSeconds());
            let s = parseInt(this.player.currentTime());
            //let s = parseInt(this.player.currentTime() - 500);
            if (this.cueIndex >= sp.length) {
              this.cueIndex = 0;
              $text.find("span.cur").removeClass("cur");
            }

            if (this.cueIndex > 0) {
              let t = sp.eq(this.cueIndex);
              t.addClass("cur");

              if (this.dict) {
                let title = t.find(".newWord").text().trim();
                title && (this.title = title);
              }

              if (!t.attr("skip")) this.scrollMid(t, $text);
              this.cueIndex++;
            } else
              for (let j = 0; j < sp.length; j++) {
                let t = sp.eq(j);
                if (t && t.attr("begin") <= s && t.attr("end") > s) {
                  //if (j == this.cueIndex) break;
                  $text.find("span.cur").removeClass("cur");
                  t.addClass("cur");
                  if (this.dict) {
                    let title = t.find(".newWord").text().trim();
                    title && (this.title = title);
                  }
                  // sp.eq(this.cueIndex).removeClass("cur");
                  this.cueIndex = j + 1;
                  this.scrollMid(t, $text);
                  break;
                }
              }
          };
        }
      } else {
        let $text = $(this.$refs.text);
        let $lynx = $(this.$refs.lynx);
        let lastPos = 0;
        $text.animate({ scrollTop: -$text.height() }, 100);
        this.scrollTimer = setInterval(() => {
          let st = 0;
          let h = $text.height();
          let s = $lynx.height() - h;
          let duration = this.player.duration();
          let v = (s + h / 2) / duration;
          //let delay = h  / v;
          // let pace = Math.ceil((2 * s) / (duration - delay - delay));
          let pace = Math.ceil(2 * v);
          if (
            // this.player.currentTime() >= delay - 6 &&
            this.player.currentTime() != lastPos
          ) {
            st = $text.scrollTop() + pace;
            $text.animate({ scrollTop: st }, 100);
            lastPos = this.player.currentTime();
          }

          this.top = Math.floor(100 * Math.min(1, (1.0 * st) / s)) + "%";
        }, 2000);
      }
    },

    async bg() {
      return new Promise((resolve) => {
        service(
          null,
          {
            cmd: "bg",
            title: this.title,
          },
          function (response) {
            if (response) resolve();
          }
        );
      });
    },
    markNewWords(t) {
      var dict = this.words;
      window.words = dict;
      this.text = htmlTrans(dict, t.replace(/\n/g, "<br />"));
    },
    ajustTextHeight() {
      var topDom = this.$refs.text;

      topDom.style.top =
        $(this.$refs.videoCon).height() + $(this.$refs.bts).height() + "px";
    },
    next() {
      console.log("next");
      this.end(0);
    },
    prev() {
      this.end(1);
    },
    end(reverse) {
      /*let video = document.querySelector("video");
      if (this.isLoop && video) {
        video.currentTime = 0;
        video.play();
        return;
      }*/
      this.cueIndex = 0;
      this.scroll(true);
      bus.$emit("end", this.videoId, reverse, this.videoIndex, this.subIndex);
    },

    cuechange(cue, track) {
      if (this.onCuesChangeSync2) {
        this.onCuesChangeSync2(cue, track);
      }
      if (this.onCuesChangeSync) {
        this.onCuesChangeSync(cue, track);
      }
    },
    init() {
      var self = this;
      $(this.$refs.top).scroll(function () {
        self.ajustTextHeight();
      });

      let audio = $(this.$refs.audio);
      audio.onended = function () {
        self.end();
      };
      audio.onerror = function () {
        self.end();
      };
      audio.onpause = function () {
        self.playing = 0;
      };
      audio.onplay = function () {
        self.playing = 1;
      };
    },
    trimDup(r) {
      var ret = [];
      var lines = r.split("\n");
      for (var i = 0; i < lines.length - 1; i++) {
        if (lines[i].trim()) {
          for (var j = i + 1; j < lines.length; j++) {
            if (lines[j].indexOf(lines[i]) == 0) {
              // console.log('i',i,'j',j)
              i = j;
            }
          }
        }
        // console.log(i,lines[i])

        ret.push(lines[i]);
      }
      ret = ret.map((e, i) => (i == 0 ? e : e.toLowerCase()));
      var re = ret
        .join("\n")
        .split(/(?=\d{2}:\d{2}:\d{2}.\d{3} --> \d{2}:\d{2}:\d{2}.\d{3})/)
        .map((e, i, arr) => {
          return i == 0 || i == arr.length - 1
            ? e
            : e.replace(
                /\d{2}:\d{2}:\d{2}.\d{3}\n/,
                arr[i + 1].split(" -->")[0] + "\n"
              );
        })
        .join("");
      return re;
    },
    async loadTTV(webvtt) {
      this.cc = 0;
      let raw = "";
      let text = "";

      if (webvtt) {
        let r = "";
        if (webvtt.indexOf("http") == 0) {
          try {
            r = await fetch(webvtt).then((r) => r.text());

            if (r.indexOf("<?xml") == 0) {
              r = r.replace(/\n/g, "");
              let p = /<p begin="(.*?)" end="(.*?)".*?>(.*?)<\/p>/g;
              let m;
              let vtt = "WEBVTT\n\n";

              let padding = -1;
              while ((m = p.exec(r)) != null) {
                if (padding == -1) padding = m[1].length == 12 ? 0 : 1;
                if (padding) {
                  vtt += `${m[1]}0 --> ${m[2]}0\n${m[3]
                    .replace(/<.*?>\s*/g, " ")
                    .trim()}\n\n`;
                } else {
                  vtt += `${m[1]} --> ${m[2]}\n${m[3]
                    .replace(/<.*?>\s*/g, " ")
                    .trim()}\n\n`;
                }
              }
              r = vtt;
              this.cc = 1;
            }
          } catch (e) {
            console.log(e);
          }
        }
        let upper = r.match(/[A-Z]/g);
        let lower = r.match(/[a-z]/gi, "");
        this.cc = 0;
        if (upper && lower && upper.length / lower.length > 0.4) {
          var ar = r.split(/\n+/).filter((e) => e.indexOf(":") != 2);
          ar.shift();
          var temp = [];
          for (var i = 0; i < ar.length; i++) {
            var cl = ar[i].trim();
            for (var j = i + 1; j < ar.length; j++) {
              var nl = ar[j].trim();
              if (nl.indexOf(cl) > -1) {
                i = j;
                cl = ar[i].trim();
                continue;
              }
              break;
            }

            var k = temp.length;
            i;
            for (var jj = k - 1; jj >= 0 && k >= temp.length - 4; jj--) {
              var tl = temp[jj];
              if (cl.indexOf(tl) == 0) {
                k = jj;
                continue;
              }
            }
            temp.length = k;

            temp.push(cl);
          }
          r = temp.join(" ").toLowerCase().replace(/\s+/, " ");
        } else {
          this.cc = 1;
        }

        raw = r;
        console.log(this.isCc, this.cc);
        if (this.isCc && !this.cc) {
          this.next();
          return 1;
        }
        if (raw.trim()) {
          raw = htmlTrans(this.words, raw, false);
        }
        if (this.cc) {
          text = this.trans(raw);

          this.text = "";
          setTimeout(() => {
            this.text = this.caption2Text(raw);
          }, 500);
        } else {
          r = r.replace(/\.[\s]+/g, ".\n");
          this.markNewWords(r);
        }

        setTimeout(() => this.scroll(), 1000);
      }

      let player = this.player;
      let tracks = player.textTracks();
      for (var d = 0; d < tracks.length; d++) {
        console.error(tracks[d].label);

        if (tracks[d].label == "new word")
          player.removeRemoteTextTrack(tracks[d]);
      }

      if (text.trim()) {
        // console.error(raw);

        var subBlob = new Blob([raw]);
        var subURL = URL.createObjectURL(subBlob);

        player.addRemoteTextTrack(
          {
            kind: "captions",
            label: "new word",
            mode: "showing",
            srclang: "zh",
            default: "true",
            src: subURL,
          },
          true
        );
      }
      return 0;
    },
    caption2Text(raw) {
      return (
        "<span>" +
        raw
          .split(/\n/)
          .map((e) => e.replace(/^(\s*[A-Z][^A-Z]+)/g, "<br />$1"))
          .join("\n")
          .replace(
            /(\d{2}):(\d{2}):(\d{2}).(\d{3}) --> (\d{2}):(\d{2}):(\d{2}).(\d{3})/g,
            (a, a1, a2, a3, a4, a5, a6, a7) =>
              `<span begin="${a2 * 60 + parseInt(a3)}" end="${
                a6 * 60 + parseInt(a7)
              }">`
          )
          .replace(/<span/g, "</span><span")
      );
    },
    trans(raw) {
      let temp = $("<div>" + raw + "</div>");
      temp.find("em.newWord").replaceWith(function () {
        var t = $(this);

        let en = t.find(".newWorda").text();
        let zh = t.find(".newWordb").text();
        return `<i>${en}</i><b>${zh}</b>`;
      });
      return temp.html().replace(/&gt;/g, ">");
    },
    async loadVideo(item, mediaType, nextItem) {
      let skip = 0;

      await getAndPrepareNextExtra(item, mediaType, nextItem);

      this.onCuesChangeSync2 = 0;
      this.text = "";

      if (this.show) {
        try {
          if (!this.isAliPlayer) await this.loadTTV(item.cc);
        } catch (e) {
          console.error(e);
        }
        if (!item.cc) {
          skip = 0;
          this.cc = 2;
          setTimeout(() => {
            this.tryCaption2TTV();
          }, 0);
        }
      }

      if (this.isAudio) {
        try {
          let ret = await getAAduio(item, this.isAudio);
          this.videoUrl = ret[0];
          this.av = ret[1];

          console.log(this.videoUrl);
        } catch (e) {
          console.error(e);
          throw e;
        }
      } else {
        this.av = 1;
        if (!skip) {
          this.videoUrl = item.url;
        }
      }
      setTimeout(() => {
        this.ajustTextHeight();
      }, 1000);
    },

    scrollMid(span, $parent) {
      if (!span || !span.offset) return;
      if (!span.offset()) return;
      let y =
        span.offset().top +
        $parent[0].scrollTop -
        $parent.offset().top -
        $parent.height() / 2;
      /*
      document
        .getElementsByClassName(parent)[0]
        .scrollTo(
          0,
          y
        );
        */
      $($parent).animate({ scrollTop: y }, 1000);
    },
  },
  mounted() {
    let self = this;

    this.isLoop = !sessionStorage.isLoop ? "" : sessionStorage.isLoop;
    this.init();
    bus.$on("videoId", (mediaType, item, click, index, index2, nextItem) => {
      if (click) this.show = 1;
      this.nextItem = nextItem;
      this.videoId = item.vid;
      this.title = item.title;
      this.item = item;
      this.videoIndex = index;
      this.subIndex = index2;
      this.mediaType =
        mediaType == 0 && item.url && !/\.m(p3|3u8|p4)/.exec(item.url) ? 0 : 1;
      if (this.mediaType == 0) {
        if (this.player) {
          this.player.pause();
          try {
            this.player.src([{ src: "a.mp3" }]);
          } catch (ee) {
            console.error(ee);
          }
        }
        this.url = this.$refs.audio.src = this.videoId;
        this.$refs.audio.play();
      } else {
        (async () => {
          try {
            await this.loadVideo(item, mediaType, nextItem);
            this.$refs.audio && this.$refs.audio.pause();
          } catch (e) {
            console.error(e);
            this.end();
          }
        })();
      }
    });
    bus.$on("videos", (videos) => {
      this.videos = videos;
    });
    bus.$on("playing", (status) => {
      this.playing = status;
    });
    bus.$on("togglePlay", () => {
      console.error("togglePlayer");
      if (this.mediaType == 2) {
        if (this.playing) this.$refs.audio.pause();
        else this.$refs.audio.play();
      } else {
        if (this.playing) this.player.pause();
        else this.player.play();
      }
    });

    bus.$on("showPlayer", () => {
      this.show = !this.show;
    });

    $(window).on("resize", function () {
      self.ajustTextHeight();
    });
  },

  watch: {
    isAutoScroll() {
      this.scroll();
    },
    show(n) {
      if (n) {
        setTimeout(() => {
          $(window).resize();
        }, 100);
      }
    },
    isLoop(b) {
      sessionStorage.isLoop = b;
      document.querySelector("video").loop = b ? true : false;
    },
    isBg(b) {
      if (b) {
        (async () => {
          for (; this.isBg; ) await this.bg();
          await new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        })();
      }
    },
    isAudio(b) {
      sessionStorage.isAudio = b;

      (async () => {
        try {
          await this.loadVideo(this.item, this.mediaType, this.nextItem);
        } catch (e) {
          console.error(e);
          this.end();
        }
      })();
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
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 0;
}

#bts.preload {
  background: #ddd;
  border-bottom: 1px solid green;
}
#bts a {
  display: inline-block;
  margin: 0px 0px 5px 5px;
  padding: 6px 6px;
  outline: none;
  text-align: center;
  cursor: pointer;
  color: white;
  background-color: rgba(0, 64, 156, 0.8);
  user-select: none;
  line-height: 1.2em;
  flex-grow: 1;
}
#bts input {
  margin: 0;
  padding: 0;
}
#bts a.enable {
  color: red;
}

.audio >>> .video-js.vjs-16-9 {
  padding-top: 90px !important;
}
a.selected {
  font-weight: bold;
}
.fs-1 >>> .vjs-text-track-cue,
.fs-1 >>> .text {
  font-size: 125% !important;
}
.fs-1 video::-webkit-media-text-track-display,
.fs-1 ::cue {
  font-size: 100% !important;
}

.fs-2 >>> .vjs-text-track-cue,
.fs-2 >>> .text {
  font-size: 150% !important;
}
.fs-2 video::-webkit-media-text-track-display,
.fs-2 ::cue {
  font-size: 125% !important;
}
.fs-3 >>> .text {
  font-size: 175% !important;
}

.fs-3 video::-webkit-media-text-track-display,
.fs-3 ::cue {
  font-size: 150% !important;
}
.fs-4 >>> .text {
  font-size: 200% !important;
}

.fs-4 video::-webkit-media-text-track-display,
.fs-4 ::cue {
  font-size: 170% !important;
}
</style>
