<template>
  <div class="new2">
    <div class="newbar">
      <input
        placeholder="http:// or https:// url"
        class="urlinput"
        v-model="url"
        @blur="fetchUrl"
        @focus="url = ''"
      />
    </div>
    <div
      v-infinite-scroll="loadMore"
      infinite-scroll-disabled="busy"
      infinite-scroll-distance="20"
      ref="container"
    >
      <div style="padding: 5px; background: white; user-select: none">
        <table style="text-align: left; width: 100%" class="row">
          <tr
            v-for="(item, i) in pageList"
            :key="item.link"
            :class="{ cur: curIndex == i }"
          >
            <td>
              <div
                class="item"
                @mouseover="curIndex = i"
                @click="open(item, i)"
                :class="{
                  cur: curIndex == i,
                  loading: item.show && curIndex == i && loading == 1,
                  loaded: item.show && curIndex == i && loading == 2,
                  readed: item.desc,
                }"
              >
                <img
                  v-if="item.thumb"
                  class="thumb"
                  :src="item.thumb"
                  referrerpolicy="no-referrer"
                />
                <div>
                  <div class="title">{{ i + 1 }}. {{ item.title }}</div>
                  <div class="info">
                    <span class="name">{{ item.name }}</span>
                    <span class="date">{{ getDate(item) }}</span>
                  </div>
                </div>
              </div>
              <div :id="'a' + i">
                <div class="desc" v-show="item.show" v-html="item.desc"></div>
                <div v-if="item.show" @click="close(item, i)" class="close">
                  <a class="bt">Close</a>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
      <div
        v-if="pageList.length == 0"
        style="text-align: center; cursor: pointer"
        @click="fresh()"
      >
        <a>Refresh</a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { GetSelectedText } from "@/service";
import { htmlTrans2 } from "@/HtmlTrans";
import $ from "jquery";
import bus from "@/bus";
import { crossOrigs } from "@/config";
import PullToRefresh from "pulltorefreshjs";
import { encode, decode } from "@/compress";

export default {
  data() {
    return {
      url: "",
      pageSize: 20,
      page: 1,
      curVideoId: "",
      search: "",
      busy: 0,
      news: [],
      curIndex: 0,
      loading: 0,
    };
  },
  created() {},
  filters: {
    fmtDate(str) {
      return str.substring(4, 6) + "-" + str.substring(6, 8);
    },
  },
  computed: {
    pageList() {
      let list = this.searchList();
      if (list.length == 0) return list;
      list = list.slice(0, this.page * this.pageSize);
      return list;
    },

    pages() {
      let list = this.searchList();

      return Math.floor((list.length + this.pageSize - 1) / this.pageSize);
    },
    ...mapState(["words"]),
  },
  methods: {
    close(item) {
      setTimeout(() => {
        $("html, body").animate(
          {
            scrollTop: item.scrollTop,
          },
          300
        );
      }, 300);
      item.show = false;
    },
    clickHandler(event) {
      bus.$emit("click", event);
    },
    async fetchUrl() {
      let url =
        "https://ftr.fivefilters.net/makefulltextfeed.php?max=1&url=" +
        encodeURIComponent(this.url);

      if (this.url && this.url.match("http.+")) {
        if (this.news.filter((e) => e.link == this.url).length == 0) {
          let xml = await crossOrigs(url, "xml");
          console.log(xml.rss.channel.item);
          xml.rss.channel.item.pubDate = xml.rss.channel.item.pubDate.replace(
            " +0000",
            ""
          );
          this.news.unshift(xml.rss.channel.item);
          this.loadContent(xml.rss.channel.item, 0);
        } else {
          alert(this.url + " already exists!");
        }
      }
    },

    open(item, i) {
      if (GetSelectedText().toString() != "") return;
      this.curIndex = i;
      this.loading = 1;
      item.scrollTop = $("html, body").scrollTop();
      this.$set(item, "show", !item.show);

      setTimeout(() => {
        this.loadContent(item, i);
      }, 0);
    },
    async loadContent(item) {
      console.log(item);
      if (GetSelectedText().toString() != "") return;
      if (!item.show) return;

      let id = item.link.replace(/.+\/(.*?\/[^/]+)/, "$1");
      let content = await this.loadCache("new-" + id).catch(() => "");
      console.log(content);
      if (!content && item.link) {
        let url =
          "https://ftr.fivefilters.net/makefulltextfeed.php?max=1&url=" +
          encodeURIComponent(item.link);
        let xml = await crossOrigs(url, "xml");
        let description = xml.rss.channel.item.description;

        content = description.replace(/(<\/?a.*?>)|(<\/?span.*?>)/g, "");

        let el = $("<div>" + content + "</div>");
        let as = ["title", "src", "srcset", "class"];
        el.find("*").each(function () {
          let self = $(this);
          let rm = [];
          $.each(this.attributes, function () {
            if (!this) return;
            if (this.specified) {
              console.log(this.name, this.value);
              if (as.indexOf(this.name.toLowerCase()) == -1) rm.push(this.name);
            }
          });
          for (let a of rm) self.removeAttr(a);
        });

        el.find("iframe").remove();
        el.find("img,video").attr("referrerpolicy", "no-referrer");
        content = el[0].innerHTML;
        sessionStorage["new-" + id] = encode(content);
        // bus.$emit("new", id, content);
      }

      // let content = htmlTrans(this.words, item.desc2);
      let ret = htmlTrans2(this.words, content);
      content = ret[0];
      this.$store.commit("add2CurWords", [ret[1], 1]);

      item.desc = content;

      this.curVideoId = item.p;
      this.loading = 2;
    },
    loadMore() {
      this.busy = true;
      setTimeout(() => {
        this.page++;
        this.busy = this.pages > 0 && this.page >= this.pages;
      }, 1000);
    },

    searchList() {
      return this.news;
    },

    toPage(i) {
      if (i < 1 || i > this.pages) return;
      this.page = i;
    },
    getDate(item) {
      if (item.pubDate) {
        let d = new Date(item.pubDate);
        return d.getMonth() + 1 + "-" + d.getDate();
      }
      return "";
    },
    getImage(e) {
      if (e.thumbnail) return e.thumbnail.url;
      if (e.group && e.group.content && e.group.content.length > 0) {
        let i = e.group.content.pop();
        return i.url;
      }
    },
    fresh() {
      bus.$emit("freshnews", 1);
    },
  },
  mounted() {
    let self = this;
    PullToRefresh.init({
      mainElement: this.$refs.container,
      triggerElement: this.$refs.container,
      onRefresh() {
        self.fresh();
      },
    });

    bus.$on("swiper", (event, distance) => {
      console.log(event, distance);
      this.pageList.map((e, i) => e.show && this.close(e, i));
    });

    if (sessionStorage.news) {
      this.news.push(...decode(sessionStorage.news));
    }

    bus.$on("freshnews", (force) => {
      console.log("freshnews", force);
      let time = localStorage.freshnews || 0;
      if (!force && new Date().getTime() - time < 6 * 3600 * 1000) return;

      (async () => {
        let news = [];
        let rss = this.config.rsss.filter((e) => e.enable);
        for (let k = 0; k < rss.length; k++) {
          try {
            let items = await fetch(
              // "https://api.factmaven.com/xml-to-json/?xml=" +
              "https://api.rss2json.com/v1/api.json?rss_url=" +
                encodeURIComponent(rss[k].url)
            )
              .then((r) => r.json())
              .then((data) => {
                return data.items
                  .filter((e) => e.pubDate)
                  .map((e) => {
                    return {
                      title: e.title,
                      link: e.link,
                      pubDate: e.pubDate,
                      thumb: this.getImage(e),
                      name: rss[k].name,
                    };
                  });
              });

            news.push(
              ...items.filter((n) => n.link && n.link.indexOf("/videos/") == -1)
            );
          } catch (ee) {
            console.error(ee);
          }
        }

        let pick = [];
        let map = {};
        for (let n of this.news.concat(news)) {
          if (n && !map[n.link]) {
            n.dt = new Date(n.pubDate).getTime();
            pick.push(n);
            map[n.link] = 1;
          }
        }

        pick.sort((a, b) => b.dt - a.dt);
        pick.length = Math.min(self.config.keepNewsCount, pick.length);
        localStorage.freshnews = new Date().getTime();
        sessionStorage.news = encode(JSON.stringify(pick));
        this.news.length = 0;
        this.news.push(...pick);
      })();
    });
  },

  watch: {},
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
.desc {
  background: #eee;
  font-size: 1.6em;
  line-height: 1.4em;
  padding: 5px;
  user-select: text;
}

.desc >>> * {
  word-break: break-word;
}
.desc >>> img {
  max-width: 100%;
  width: 100%;
}
.desc >>> .image {
  background: #ccc;
}
.title {
  margin-bottom: 5px;
  font-size: 1.4em;
  display: inline-block;
  cursor: pointer;
}
.src {
  color: gray;
  font-size: 0.5em;
  padding-left: 5px;
}
.close {
  text-align: center;

  bottom: 0;
}
.close .bt {
  cursor: pointer;
  background: gold;
  display: block;
  line-height: 40px;
}
@media screen and (max-width: 415px) {
  .close {
    padding-bottom: 40px;
  }
}
.cur .close {
  position: sticky;
}
.urlinput {
  width: 100%;
  box-sizing: border-box;
  margin-top: 10px;
  flex-grow: 1;
}
.newbar {
  position: sticky;
  top: 0;
  display: flex;
  padding: 0 6px;
  background: white;
  z-index: 1;
}
.item {
  display: flex;
  position: relative;
}
.thumb {
  width: 120px;
  margin: 0;
  padding: 0;
  border: 0;
  max-width: 120px;
  flex-grow: 0;
  max-height: 120px;
  margin-right: 10px;
}
.title {
  flex-grow: 1;
  user-select: text;
}

.news2 {
  user-select: none;
}
.desc >>> * {
  margin-left: 0 !important;
  margin-right: 0 !important;
  max-width: 100% !important;
}
.info {
  display: flex;
  justify-content: space-between;
  color: #aaa;
  font-size: 80%;
}
.item:before {
  width: 0;
  height: 2px;
  position: absolute;
  bottom: -4px;
  left: 50%;
  background-color: #0188fb;
  content: "";
  transition: all 0.6s;
  z-index: 1;
}
.item.loading::before {
  width: 50%;
  left: 25%;
}

.item.loaded::before {
  width: 100%;
  left: 0;
}
.readed {
  color: gray;
}
</style>
