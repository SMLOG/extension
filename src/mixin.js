import { playSound } from "@/lib";
import { service } from "@/service";
import $ from "jquery";

const mixin = {
  data() {
    return { rwords: [] };
  },
  methods: {
    playSound(item, wait, lan = "en") {
      return playSound(item, wait, lan);
    },
    async sleep(t) {
      return new Promise((resolve) => {
        setTimeout(resolve, t);
      });
    },
    toggleItemIsNew(item, event) {
      item.n = item.n > 0 ? 0 : 1;
      item.i = item.n ? 0 : item.i;

      this.changeItemNew(item);

      if (event) event.stopPropagation();
      return false;
    },
    changeItemNew(item) {
      console.log(item);
      if (item.q.trim())
        service(null, { cmd: "newWord", content: item }, (resp) => {
          // this.$store.commit("setCurItem", resp.contents);
          this.$store.commit("newWord", resp.contents);
        });
    },
    loadRords(word) {
      if (!word) return;
      console.log(word.q);
      let self = this;
      $.ajax({
        url:
          "http://localhost/word/r/" +
          word.q.substring(0, 2) +
          "/" +
          word.q +
          ".js",
        type: "get",
        dataType: "jsonp",
        jsonpCallback: word.q,
        timeout: 5000,
        cache: 1,
        success: function (data) {
          console.log(data);
          self.rwords.length = 0;
          let list = data[1].slice(Math.min(5, data[1].length)).map((e) => {
            return { q: e[0], to: e[1], am: e[2] };
          });

          self.rwords.push(...list);
        },
        error: function (err) {
          console.error(err);
          self.rwords.length = 0;
        },
      });
    },
    scroll2el($el, $parent) {
      console.log($el);

      let y = $el.offset().top + $parent[0].scrollTop - $parent.offset().top;

      window.cancelAnimationFrame(window.requestAnimationFrame1);
      window.requestAnimationFrame1 = window.requestAnimationFrame(() => {
        $($parent).animate({ scrollTop: y }, 500);
      });
      //  $($parent).animate({ scrollTop: y }, 1000);
    },
  },
};
export default mixin;
