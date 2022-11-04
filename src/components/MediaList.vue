<template>
  <div class="list" style="position: relative; user-select: none">
    <div v-show="loading" style="text-align: center">
      <font-awesome-icon icon="fa-solid fa-spinner" />
    </div>
    <div
      v-infinite-scroll="loadMore"
      infinite-scroll-disabled="busy"
      infinite-scroll-distance="30"
      style="max-height: 400px; overflow: auto"
    >
      <div style="padding: 5px; background: white">
        <table style="text-align: left; width: 100%">
          <tr
            v-for="(item, i) in pageList"
            :key="item.vid || item.title"
            style="cursor: pointer"
            :class="{ _d: item._d }"
          >
            <td>
              <template>
                <div
                  :class="{ cur: curVideoId == item.vid, ni: !item.i }"
                  v-if="refresh"
                >
                  <i class="num" @click="onFav($event, item, mediaType)">{{
                    i + 1
                  }}</i>
                  <span v-if="item.d">{{ item.d }}:</span>
                  <span @click="play(item, 1, i)">
                    {{
                      (curMediaType.title && curMediaType.title(item)) ||
                      item.title
                    }}</span
                  >
                  <span class="src" v-if="item.src">{{ item.src }}</span>

                  <span v-if="item.rate"> rate:{{ item.rate }} </span>

                  <span v-if="favMap[item.vid]">*</span>
                </div>

                <div
                  v-if="curVideoId == item.vid && item.urls && item.urls.length"
                >
                  <span
                    style="margin: 8px"
                    v-for="(url, index) in item.urls"
                    :key="index"
                    :class="{ cur: subIndex == index }"
                    @click="play(item, 1, i, index)"
                    >{{ index + 1 }}</span
                  >
                </div>
              </template>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div style="text-align: right; background: gray; padding-right: 5px">
      <label v-if="mediaType == 1"
        ><input type="checkbox" v-model="done" />
        Done
      </label>
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
      <select v-model="mediaType" @change="changeMediaType()">
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
      let c = item["tvg-country"];
      return c + ":" + item.title;
    },
    cnt: {},
  },
  {
    n: "MJ",
    data: [],
    c: [],
    disabled: 1,
  },
];
let myListSrcs = Array.from(
  new Set(myList.map((e) => mediaTypes[e.mediaType].n))
);
mediaTypes[2].c = myListSrcs;
export default {
  data() {
    return {
      refresh: 1,
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
      switch (this.mediaTypes[this.mediaType].n) {
        case "TV":
          if (this.mediaTypes[this.mediaType].data.length == 0) {
            let ss = sessionStorage;
            let allChannels = this.mediaTypes[this.mediaType].data;
            let types = this.mediaTypes[this.mediaType].c;
            let langs = this.mediaTypes[this.mediaType].c2;
            let mapCount = this.mediaTypes[this.mediaType].cnt;

            const groupTitle = "group-title";
            const language = "tvg-language";
            (async () => {
              if (this.loading) return;
              this.loading = 1;
              if (ss.getItem("chs")) {
                allChannels.push(...JSON.parse(ss.getItem("chs")));
                types.push(...JSON.parse(ss.getItem("chs_groups")));
                langs.push(...JSON.parse(ss.getItem("chs_langs")));
                Object.assign(mapCount, JSON.parse(ss.getItem("chs_cnt")));
              } else
                for (let k = 10; k > 0; k--) {
                  try {
                    var con = await fetch(
                      "https://iptv-org.github.io/iptv/index.m3u?cache=1296000000"
                    ).then((r) => r.text());
                    let lines = con.split(/\n+/);

                    let reg = /([^\s=]+)="(.*?)"/g;
                    for (let i = 0; i < lines.length; i++) {
                      let ch = {};
                      if (lines[i].indexOf("#EXTINF") == 0) {
                        let m;
                        while ((m = reg.exec(lines[i]))) {
                          ch[m[1]] = m[2];
                        }
                        let lang = ch["tvg-language"];
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

                          lang &&
                            lang.split(/;/).forEach((e) => {
                              langs.indexOf(e) == -1 && langs.push(e);
                            });
                        }
                      }
                    }
                    allChannels.sort((a, b) =>
                      a[groupTitle].localeCompare(b[groupTitle])
                    );
                    types.sort();
                    langs.sort();
                    ss.setItem("chs", JSON.stringify(allChannels));
                    ss.setItem("chs_groups", JSON.stringify(types));
                    ss.setItem("chs_langs", JSON.stringify(langs));
                    allChannels.forEach((e) => {
                      if (e[groupTitle]) {
                        e[groupTitle].split(";").forEach((g) => {
                          let k = g + e[language];
                          mapCount[k] = mapCount[k] ? mapCount[k] + 1 : 1;
                          mapCount[g] = mapCount[g] ? mapCount[g] + 1 : 1;
                        });
                      }

                      mapCount[e[language]] = mapCount[e[language]]
                        ? mapCount[e[language]] + 1
                        : 1;
                    });
                    ss.setItem("chs_cnt", JSON.stringify(mapCount));

                    break;
                  } catch (e) {
                    console.error(e);
                    types.length = allChannels.length = 0;
                    this.loading = 0;
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
          if (this.mediaTypes[this.mediaType].data.length == 0) {
            if (this.loading) return;
            this.loading = 1;
            fetch("https://smlog.github.io/data/radios.json")
              .then((r) => r.json())
              .then((resp) => {
                this.loading = 0;

                if (resp.content && resp.content.length) {
                  this.mediaTypes[this.mediaType].data.push(
                    ...resp.content.map((e) => {
                      e.vid = e.url;
                      return e;
                    })
                  );
                }
              });
          }

          break;

        case "lo":
          if (prompt("confirm:") != "12345") {
            this.mediaType = 0;
          }
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

    play(item, click, index, index2, nextItem) {
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
      if (run)
        bus.$emit(
          "videoId",
          parseInt(
            item.mediaType != undefined ? item.mediaType : this.mediaType
          ),
          item,
          click,
          index,
          index2,
          !nextItem && !index2
            ? this.pageList[index + 1 < this.pageList.length ? index + 1 : 0]
            : 0
        );

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
    bus.$on("end", (videoId, reverse, i, i2) => {
      let list = this.searchList();

      let index = i;
      let index2 = i2;

      let nextItem;
      if (this.mediaType != 4) {
        if (reverse) {
          index--;
          if (index < 0) index = list.length - 1;
        } else {
          index++;
          if (index >= list.length) index = 0;
        }
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
.cur {
  color: red;
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
</style>
