<template>
  <div>
    <div style="position: sticky; top: 0; display: flex">
      <input
        style="
          width: 100%;
          box-sizing: border-box;
          margin-top: 20px;
          flex-grow: 1;
        "
        v-model="url"
        @blur="fetchUrl"
        @focus="url = ''"
      />
    </div>
    <div
      v-infinite-scroll="loadMore"
      infinite-scroll-disabled="busy"
      infinite-scroll-distance="20"
    >
      <div style="padding: 5px; background: white">
        <table style="text-align: left; width: 100%">
          <tr v-for="(item, i) in pageList" :key="item.title">
            <td>
              <h4
                class="title"
                :class="{ cur: curVideoId == item.p, ni: !item.i }"
                @click="loadContent(item, i)"
              >
                {{ item.pubDate }}: {{ item.title }}
              </h4>
              <div :id="'a' + i">
                <div class="desc" v-show="item.show" v-html="item.desc"></div>
                <div
                  v-if="item.show"
                  @click="close(item, i)"
                  style="text-align: center; margin-bottom: 30px"
                >
                  Close
                </div>
              </div>
            </td>
          </tr>
        </table>
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

let session = sessionStorage;
export default {
  data() {
    return {
      url: "",
      pageSize: 5,
      page: 1,
      curVideoId: "",
      search: "",
      busy: 0,
      news: (session.news && JSON.parse(session.news)) || [],
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
    close(item, i) {
      let top = $("html, body").scrollTop() - $("#a" + i).outerHeight();
      setTimeout(() => {
        $("html, body").animate(
          {
            scrollTop: top,
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
          this.news.length == Math.max(20, this.news.length);
          session.news = JSON.stringify(this.news);
          this.loadContent(xml.rss.channel.item, 0);
        } else {
          alert(this.url + " already exists!");
        }
      }
    },
    loadContent(item, i) {
      if (GetSelectedText().toString() != "") return;
      let self = this;

      if (!item.show && (item.desc2 || item.description)) {
        if (!item.desc2) {
          item.desc2 = item.description
            .replace(/(<\/?a.*?>)|(<\/?span.*?>)/g, "")
            .replace(
              /<img(.*?)>/gi,
              `<iframe style="width:100%;margin:0;padding:0;border:0;" frameborder="no" border="0" class="img"  $1 ></iframe>`
            )
            .replace(/src=/i, 'src = "about:blank" _src=');
          delete item.description;
        }

        // let content = htmlTrans(this.words, item.desc2);
        let ret = htmlTrans2(this.words, item.desc2);
        let content = ret[0];
        this.$store.commit("add2CurWords", [ret[1], 1]);

        setTimeout(() => {
          let ifrs = document.querySelectorAll("#a" + i + " iframe.img");
          for (let j = 0; j < ifrs.length; j++) {
            let ifr = ifrs[j];
            let src = ifr.getAttribute("_src");
            if (!src) {
              $(ifr).remove();
              continue;
            }

            let currentDoc = ifr.contentDocument || ifr.contentWindow.document;

            currentDoc.addEventListener("click", self.clickHandler);
            currentDoc.addEventListener("touchend", self.clickHandler);

            currentDoc.body.style.overflow = "hidden";
            currentDoc.body.innerHTML = `<img  style="width:100%;" src="${src}" />`;
            currentDoc.body.querySelector("img").onload = function () {
              $(ifr).height($(ifr).contents().height());
            };

            // $(ifr).width($(ifr).contents().width());
          }
        }, 100);

        item.desc = content;

        this.curVideoId = item.p;
      }

      this.$set(item, "show", !item.show);
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
  },
  mounted() {
    bus.$on("swiper", (event, distance) => {
      console.log(event, distance);
      this.pageList.map((e, i) => e.show && this.close(e, i));
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
.cur {
  color: red;
}
.ni {
  color: gray;
}
.desc {
  background: #eee;
  font-size: 1.6em;
  line-height: 1.4em;
  padding: 5px;
}
.desc >>> img {
  max-width: 100%;
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
</style>
