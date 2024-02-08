<template>
  <div class="list" style="position: relative; user-select: none">
    <div>
      <div
        class="op"
        v-if="mediaType == 5"
        style="display: flex; justify-content: space-between"
      >
        <div class="a-upload">
          <input name="files" type="file" @change="upload($event)" />Upload
        </div>
      </div>
    </div>
    <div v-show="loading" style="text-align: center">
      <font-awesome-icon icon="fa-solid fa-spinner" />
    </div>
    <div
      v-infinite-scroll="loadMore"
      infinite-scroll-disabled="busy"
      infinite-scroll-distance="30"
      style="max-height: 400px; overflow: auto"
    >
      <div class="result" ref="container2">
        <table style="text-align: left; width: 100%">
          <tr
            v-for="(item, i) in pageList"
            :key="item.vid || item.title"
            style="cursor: pointer"
            :class="{ _d: item._d, _c: item._c }"
          >
            <td>
              <div @click.stop="play(item, 1, i);updateConfig2({showList:0})" >
                <template>
                  <div
                    :class="{
                      cur: curVideoId == item.vid,
                      ni: !item.i,
                      cached: item.cached,
                    }"
                    v-if="refresh"
                  >
                    <i
                      class="num"
                      @click.stop="onFav($event, item, mediaType)"
                      >{{ i + 1 }}</i
                    >
                    <span v-if="item.d">{{ item.d }}:</span>
                    <span>
                      {{
                        (curMediaType.title && curMediaType.title(item)) ||
                        item.title
                      }}</span
                    >
                    <span class="src" v-if="item.duration">{{ ("0"+parseInt(item.duration/60)).substr(-2) }}:{{ ("0"+item.duration%60).substr(-2) }}</span>

                    <span class="src" v-if="item.src">{{ item.src }}</span>

                    <span class="src" v-if="item.org">{{ item.org }}</span>
                    <span
                      class="del"
                      @click.stop="del(item, mediaType)"
                      v-if="mediaTypes[mediaType].del"
                      >x</span
                    >

                    <span v-if="item.rate"> rate:{{ item.rate }} </span>

                    <span v-if="favMap[item.vid]">*</span>
                  </div>

                  <div
                    v-if="
                      curVideoId == item.vid && item.urls && item.urls.length
                    "
                  >
                    <span
                      style="margin: 8px"
                      v-for="(url, index) in item.urls"
                      :key="index"
                      :class="{ cur: subIndex == index }"
                      @click.stop="play(item, 1, i, index)"
                      >{{ index + 1 }}</span
                    >
                  </div>
                </template>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div style="text-align: right; background: gray; padding-right: 5px">

      <select v-show="opts1.length" v-model="curOpt1" @change="page = 1">
        <option value="">All</option>
        <option v-for="src in opts1" :key="src" :value="src">
          {{ src }}<span v-if="cnt">({{ cnt[src + curOpt2] }})</span>
        </option>
      </select>
      <select v-show="opts2.length" v-model="curOpt2" @change="page = 1">
        <option value="">All</option>
        <option v-for="src in opts2" :key="src" :value="src">
          {{ src }}<span v-if="cnt">({{ cnt[curOpt1 + src] }})</span>
        </option>
      </select>
      <select
        @click="ifneedload()"
        v-model="mediaType"
        @focus="changeMediaType()"
        @change="
          changeMediaType();
          ifneedload();
        "
      >
        <template v-for="(meidaType, i) in mediaTypes">
          <option v-if="!meidaType.disabled" :key="i" :value="i">
            {{ meidaType.n }}
          </option>
        </template>
      </select>
      Filter:<input
        style="width: 60px"
        v-model="search"
        @focus="focusSearch()"
      />
      (<input style="width: 25px" v-model="page" />/{{ pages }})
      <a class="ctrl" @click="toPage(page - 1)"> Prev </a>
      <a class="ctrl" @click="toPage(page + 1)"> Next </a>
    </div>
  </div>
</template>

<script>
import bus from "@/bus";
import { mapState } from "vuex";
import { service } from "@/service";
import { fetchRequest } from "@/lib";
import { cacheWordTts } from "@/tts";

import PullToRefresh from "pulltorefreshjs";
import { htmlTrans2 } from "@/HtmlTrans";

//import radios from "@/../public/radios.json";

//import iptv from "@/../public/iptv.json";
import storejs from "storejs";
import { sources } from "@/config";

const myFavKey = "my";

let myList = storejs.get(myFavKey) || [];

let mediaTypes = [
  { n: "Radio", data: [], a: 1 },
  {
    n: "Video",
    c: sources,
    data: function () {
      return this.videos;
    },
  },
  { n: "Fav", data: myList, c: [] },
  {
    n: "TV",
    data: [],
    c: [],
    s: function (e, v) {
      let content =
        e["group-title"] + e["tvg-language"] + e["tvg-country"] + e.title;
      return content.toLowerCase().indexOf(v) > -1;
    },
    c2: [],
    c2f: function (e, v) {
      let lang = e["tvg-language"];
      return lang && lang.indexOf(v) > -1;
    },
    title: function (item) {
      // let c = item["tvg-country"];
      return item.title;
    },
    cnt: {},
  },
  {
    n: "MJ",
    data: [],
    c: [],
    disabled: 1,
  },
  {
    n: "Local",
    data: [],
    c: [],
    disabled: 0,
    del: 1,
  },
  { n: "TTS", data: [], a: 1 },

];
let myListSrcs = Array.from(
  new Set(myList.map((e) => mediaTypes[e.mediaType].n))
);
mediaTypes[2].c = myListSrcs;
export default {
  data() {
    return {
      refresh: 1,
      cachedNum: 0,
      loading: 0,
      favMap: myList.reduce((m, c) => {
        m[c.vid] = 1;
        return m;
      }, {}),
      mediaTypes: mediaTypes,
      curOpt1: "",
      curOpt2: "",
      pageSize: 500,
      page: 1,
      curVideoId: "",
      search: "",
      busy: 0,
      mediaType: 1,
      subIndex: 0,
      done: 0,
    };
  },
  created() {},
  computed: {
    ...mapState(["words"]),
    preload() {
      return this.$store.state.config.preload;
    },
    cnt() {
      return this.mediaTypes[this.mediaType].cnt;
    },
    curMediaType() {
      return this.mediaTypes[this.mediaType];
    },
    opts1() {
      let r = this.mediaTypes[this.mediaType].c || [];
      let cnt = this.mediaTypes[this.mediaType].cnt;
      if (this.curOpt2 && cnt) {
        r = r.filter((e) => cnt[e + this.curOpt2]);
      }
      return r;
    },
    opts2() {
      let r = this.mediaTypes[this.mediaType].c2 || [];
      let cnt = this.mediaTypes[this.mediaType].cnt;
      if (this.curOpt1 && cnt) {
        r = r.filter((e) => cnt[this.curOpt1 + e]);
      }

      return r;
    },
    pageList() {
      let list = this.searchList();

      if (list.length > 0) list = list.slice(0, this.page * this.pageSize);
      return list;
    },

    pages() {
      let list = this.searchList();

      return Math.floor((list.length + this.pageSize - 1) / this.pageSize);
    },
    ...mapState(["videos"]),
  },
  methods: {
    ifneedload() {
      if (this.pageList.length == 0 && this.curMediaType.n == "Video") {
        bus.$emit("fresh", "videos", 1);
      }
    },
    async cacheWords(item) {
      let cc = 0;
      let raw = "";
      let text = "";
      let webvtt = item.cc;

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
              cc = 1;
            }
          } catch (e) {
            console.log(e);
          }
        }
        let upper = r.match(/[A-Z]/g);
        let lower = r.match(/[a-z]/gi, "");
        cc = 0;
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
          cc = 1;
        }

        console.log(cc, text);
        raw = r;

        if (raw.trim()) {
          let ret = htmlTrans2(this.words, raw, false);

          console.error(ret[1]);

          for (let j = 0; j < ret[1].length; j++) {
            console.log(ret[1][j].q);
            console.log(ret[1][j].to);
            console.error("start " + j);

            await cacheWordTts(ret[1][j].q, ret[1][j].to);
            console.error("done " + j);
          }
        }
      }
    },
    getFileBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    },
 
    del(item) {
      if (confirm("delete?"))
        fetch("cache/local", {
          method: "put",
          headers: {
            type: "video/mp4",
            name: encodeURIComponent(item.title),
            delete: item.url,
          },
        }).then(() => {
          let i = this.mediaTypes[this.mediaType].data.indexOf(item);
          if (i > -1) {
            this.mediaTypes[this.mediaType].data.splice(i, 1);
          }
        });
    },
    async upload(event) {
      let file = event.target.files[0];
      // let content = await this.getPictureBase64(file);
      // console.log(content);
      // this.imgs.push(content);
      // localStorage.setItem("imgs", JSON.stringify(this.imgs));
      console.log(file);
      if (!file.name || !file.size) return;
      let name =
        [new Date(file.lastModified)]
          .map((e) =>
            [e.getFullYear(), e.getMonth() + 1, e.getDate()].join("/")
          )
          .join("") +
        " " +
        Math.ceil(file.size / 1024 / 1024) +
        "M " +
        file.name;

      console.error("put " + "cache/local");
      let content = await this.getFileBase64(file);
      fetch("cache/local", {
        method: "put",
        body: content, // blob,
        headers: {
          type: file.type || "video/mp4",
          encode: "base64",
          name: encodeURIComponent(name),
          cat: this.search.trim(),
        },
      })
        .then((e) => e.json())
        .then((e) => {
          console.log(e);
          setTimeout(() => {
            this.loadLocal();
          }, 10);
        });
      /*fetch(content)
          .then((r) => r.blob())
          .then((b) => b.arrayBuffer())
          .then((buff) =>
            console.log(new Int8Array(buff)
          )
          .catch((e) => console.log(e));*/
    },
    async loadLocal() {
      try {
        await fetchRequest("list/cache/local")
          .then((r) => r.json())
          .then((resp) => {
            console.error(resp);
            this.loading = 0;

            if (resp && resp.length) {
              this.mediaTypes[this.mediaType].data.splice(
                0,
                this.mediaTypes[this.mediaType].data.length
              );
              this.mediaTypes[this.mediaType].data.length = 0;
              this.mediaTypes[this.mediaType].data.push(
                ...resp.map((e) => {
                  e.vid = e.url;
                  return e;
                })
              );
            }
          });
      } catch (eee) {
        console.error(eee);
      }
    },
    onFav(event, item, mediaType) {
      event.stopPropagation();
      if (mediaType != 2) item.mediaType = mediaType;

      let index = -1;
      for (var i = 0; i < myList.length; i++) {
        if (myList[i].vid == item.vid) {
          index = i;
          break;
        }
      }
      if (index > -1) {
        myList.splice(index, 1);
      } else {
        myList.push(item);
      }
      item.fav = this.favMap[item.vid] = index > -1 ? 0 : 1;
      this.$set(this.favMap, item.vid, item.fav);

      let newSrcs = Array.from(
        new Set(myList.map((e) => mediaTypes[e.mediaType].n))
      );
      this.mediaTypes[2].c.length = 0;
      this.mediaTypes[2].c.push(...newSrcs);

      this.refresh++;
      storejs.set(myFavKey, myList);
    },
    focusSearch() {
      this.search = "";
    },
    changeMediaType() {
      console.log(this.mediaType);
      let mediaAlias = this.mediaTypes[this.mediaType].n;
      let storage= sessionStorage;
      switch (mediaAlias) {
        case "TV":
          {
            let tvtime = storage.tvtime || 0;

            (async () => {
              if (new Date().getTime() - tvtime > 72 * 3600 * 1000) {
                const groupTitle = "group-title";
                this.loading = 1;
                for (let t = 0; t < 10; t++) {
                  try {
                    /*var con = await fetchRequest(
                      "https://iptv-org.github.io/iptv/index.m3u?cache=1296000000"
                    ).then((r) => r.text());*/
                    let allChannels = await fetchRequest(
                      "https://iptv-org.github.io/api/channels.json"
                    ).then((r) => r.json());
                    let streams = await fetchRequest(
                      "https://iptv-org.github.io/api/streams.json"
                    ).then((r) => r.json());
                    //let lines = con.split(/\n+/);

                    //let reg = /([^\s=]+)="(.*?)"/g;
                    //  let allChannels = [];
                    let types = [];
                    let mapCount = {};

                    let streamsMap = {};
                    for (let i = 0; i < streams.length; i++) {
                      streamsMap[streams[i].channel] = streams[i];
                    }
                    allChannels = allChannels
                      .filter((ch) => streamsMap[ch.id])
                      .map((ch) => {
                        ch["url"] = streamsMap[ch.id].url;
                        //  console.log(ch);
                        ch["vid"] = ch.id;
                        ch[groupTitle] = ch.categories.join(",");
                        ch.fav = 0;
                        ch.title = ch.name + "/" + ch.languages;
                        return ch;
                      });
                    /*for (let i = 0; i < lines.length; i++) {
                      let ch = {};
                      if (lines[i].indexOf("#EXTINF") == 0) {
                        let m;
                        while ((m = reg.exec(lines[i]))) {
                          ch[m[1]] = m[2];
                        }
                        ch["title"] = lines[i].split(",").pop();
                        i++;
                        if (lines[i].indexOf("http") == 0) {
                          ch["url"] = lines[i];
                          //  console.log(ch);
                          ch["vid"] = "ch" + i;
                          ch.src = ch[groupTitle];
                          ch.fav = 0;
                          allChannels.push(ch);

                          ch.src &&
                            ch.src.split(/;/).forEach((e) => {
                              types.indexOf(e) == -1 && types.push(e);
                            });
                        }
                      }
                    }*/
                    allChannels.sort((a, b) =>
                      a[groupTitle].localeCompare(b[groupTitle])
                    );
                    types.sort();
                    allChannels.forEach((e) => {
                      if (e[groupTitle]) {
                        e[groupTitle].split(";").forEach((g) => {
                          let k = g;
                          mapCount[k] = mapCount[k] ? mapCount[k] + 1 : 1;
                          mapCount[g] = mapCount[g] ? mapCount[g] + 1 : 1;
                        });
                      }
                    });
                    let allChannels2 = this.mediaTypes[this.mediaType].data;
                    let types2 = this.mediaTypes[this.mediaType].c;
                    let mapCount2 = this.mediaTypes[this.mediaType].cnt;
                    types2.length = allChannels2.length = 0;
                    allChannels2.push(...allChannels);
                    types2.push(...types);
                    Object.assign(mapCount2, mapCount);
                    storage.tvtime = new Date().getTime();
                    break;
                  } catch (e) {
                    console.error(e);
                    await this.sleep(2000);
                    t++;
                  }
                }
              }
              this.loading = 0;

            })();
          }
          break;
        case "MJ":
          if (this.mediaTypes[this.mediaType].data.length == 0) {
            if (this.loading) return;
            this.loading = 1;

            service(
              null,
              { cmd: "urls", content: { p: "mj.json", cache: 86400000 } },
              (resp) => {
                this.loading = 0;

                if (resp.content && resp.content.length) {
                  this.mediaTypes[this.mediaType].data.push(
                    ...resp.content.map((e) => {
                      return {
                        vid: e[0],
                        title: e[1],
                        urls: [],
                        rate: e[2],
                        date: e[4],
                      };
                    })
                  );
                }
              }
            );
          }

          break;
          case "Radio":
          case "TTS":
          {
            if (this.loading) return;
            this.loading = 1;
            let radiotime = localStorage[this.mediaType+"time"]|| 0;
            let mediaType = this.mediaType;
            console.log(this);
            (async () => {
              if (1 || new Date().getTime() - radiotime > 72 * 3600 * 1000) {
                for (let t = 0; t < 10; t++) {
                  try {
                    let radios = await fetchRequest(
                      "https://smlog.github.io/data/"+mediaAlias.toLowerCase()+"s.json"
                    )
                      .then((r) => r.json())
                      .then((resp) => {
                        this.loading = 0;

                        if (resp.content && resp.content.length) {
                          let data = resp.content.map((e) => {
                            e.vid = e.url;
                            return e;
                          });
                          return data;
                        }
                      });

                    console.log(radios);
                    if (radios) {
                      this.mediaTypes[mediaType].data.length = 0;

                      console.log(radios);
                      this.mediaTypes[this.mediaType].data.push(...radios);
                      await this.saveCache(mediaAlias, radios);
                      localStorage[this.mediaType+"time"]= new Date().getTime();
                    }
                    break;
                  } catch (eee) {
                    console.error(eee);
                    await this.sleep(2000);
                    t++;
                  }
                }
              }

              this.loadCache(mediaAlias)
                .catch(() => {
                  localStorage[mediaAlias+"time"] = 0;
                })
                .then((radios) => {
                  if (!radios.length) localStorage[mediaAlias+"time"] = 0;
                  else {
                    this.mediaTypes[this.mediaType].data.length = 0;
                    console.log(radios);
                    this.mediaTypes[this.mediaType].data.push(...radios);
                  }
                });

              this.loading = 0;
            })();
          }

          break;

        case "lo":
          if (prompt("confirm:") != "12345") {
            this.mediaType = 0;
          }
          break;
        case "Local":
          this.loadLocal();

          break;
      }
    },
    loadMore() {
      this.busy = true;
      setTimeout(() => {
        this.busy = this.pages > 0 && this.page >= this.pages;
        if (!this.busy) {
          this.page++;
        }
      }, 1000);
    },
    searchList() {
      let s = this.search.toLowerCase().trim();

      if (this.mediaType == 1) {
        let videos = this.videos;

        if (this.curOpt1) videos = videos.filter((e) => e.src == this.curOpt1);
        if (this.done) videos = videos.filter((e) => e._d);

        if (!s) return videos;

        return videos.filter(
          (e) => e.d.indexOf(s) > -1 || e.title.toLowerCase().indexOf(s) > -1
        );
      }

      let mediaArr = this.mediaTypes[this.mediaType].data;
      let opt2f = this.mediaTypes[this.mediaType].c2f;
      let search =
        this.mediaTypes[this.mediaType].s ||
        ((e, s) => e.title.toLowerCase().indexOf(s) > -1);

      if (this.mediaType == 2) {
        if (this.curOpt1)
          mediaArr = mediaArr.filter(
            (e) => mediaTypes[e.mediaType].n == this.curOpt1
          );
      } else {
        if (this.curOpt1)
          mediaArr = mediaArr.filter((e) => e.src.indexOf(this.curOpt1) > -1);
      }

      if (this.curOpt2 && opt2f)
        mediaArr = mediaArr.filter((e) => opt2f(e, this.curOpt2));

      if (!s) return mediaArr;
      else return mediaArr.filter((e) => search(e, s));
    },

    play(item, click, index, index2) {
      this.curVideoId = item.vid;
      console.log("vidoeId" + item.vid);
      let run = 1;
      if (this.mediaType == 4) {
        index2 = index2 || 0;
        this.subIndex = index2;

        if (item.urls.length) item.url = item.urls[index2];
        else {
          run = 0;
          service(
            null,
            { cmd: "urls", content: { p: "mj/" + item.vid, cache: 86400000 } },
            (resp) => {
              if (resp.content && resp.content.length) {
                item.urls.push(...resp.content);
                item.url = item.urls[index2];
                bus.$emit(
                  "videoId",
                  parseInt(this.mediaType),
                  item,
                  click,
                  index,
                  index2
                );
              }
            }
          );
        }
      }
      if (run) {
        console.log(this.config2.playList);
        let cPlayList =  this.config2.playList;
         cPlayList.splice(0, cPlayList.length, ...this.pageList);
        this.updateConfig2({
          mediaType:this.mediaType,
          playList:cPlayList,playIndex:index});

      }

      if (click) {
        this.$emit("selectItem", item);
      }
    },
    toPage(i) {
      if (i < 1 || i > this.pages) return;
      this.page = i;
    },
  },
  mounted() {
    PullToRefresh.init({
      mainElement: this.$refs.container2,
      triggerElement: this.$refs.container2,
      onRefresh() {
        bus.$emit("fresh", "videos", 1);
      },
    });

    bus.$on("end", (videoId, reverse, i, i2) => {
      let list = this.searchList();

      let index = i;
      let index2 = i2;

      let nextItem;
      if (this.mediaType != 4) {
        let add = reverse ? -1 : 1;
        let findit = -1;
        //search back or forward
        console.log("end");
        for (let j = i + add; j >= 0 && j < list.length; j += add) {
          if (this.config.isAudio && this.mediaType == 1) {
            if (list[j].audio === 0 || list[j].src == "cnn") continue;
          }
          findit = j;
          break;
        }

        if (findit == -1) {
          for (let j = 0; j < list.length; j++) {
            if (this.config.isAudio && this.mediaType == 1) {
              if (list[j].audio === 0 || list[j].src == "cnn") continue;
            }
            findit = j;
            break;
          }
        }
        if (findit == -1) findit = 0;
        index = findit;
      } else {
        let mlen = list[index].urls.length;

        if (reverse) {
          index2--;
          if (index2 < 0) index2 = mlen - 1;
        } else {
          index2++;
          if (index2 >= mlen) index2 = 0;
        }

        if (index > 0) nextItem = list[index - 1];
      }
      this.play(list[index], 0, index, index2, nextItem);
    });
  },

  watch: {
    mediaType() {
      this.page = 1;
      this.busy = 0;
      this.curOpt1 = this.curOpt2 = "";
    },
    "$store.state.config.mj": function (val) {
      mediaTypes[4].disabled = !val;
    },
  },
};
</script>

<style scoped>
p {
  font-size: 20px;
}
table tr:nth-child(odd) {
  background-color: #f5f5f5;
}
table tr:nth-child(even) {
  background-color: #fff;
}
.ctrl {
  user-select: none;
  cursor: pointer;
}
.ni {
  color: gray;
}
.cached {
  color: blue;
}
.cur {
  color: red !important;
}
.list >>> .src,
.list >>> .num {
  color: gray;
  font-size: 0.8em;
  display: inline-block;
  padding-right: 5px;
  cursor: pointer;
  padding-left: 5px;
}
._d .ni {
  color: blue;
}
._d.ni.cur {
  color: orangered !important;
}
._c .ni {
  color: green;
}
.result {
  padding: 5px;
  background: white;
}
.del {
  color: red;
  font-size: 0.8em;
  display: inline-block;
  padding-right: 5px;
  cursor: pointer;
  padding-left: 5px;
}

.a-upload {
  padding: 4px 10px;
  height: 20px;
  line-height: 20px;
  position: relative;
  cursor: pointer;
  color: #888;
  background: #fafafa;
  border-radius: 4px;
  overflow: hidden;
  display: inline-block;
}

.a-upload input {
  position: absolute;
  right: 0;
  top: 0;
  opacity: 0;
  cursor: pointer;
}

.a-upload:hover {
  color: #444;
  background: #eee;
  border-color: #ccc;
  text-decoration: none;
}
</style>
