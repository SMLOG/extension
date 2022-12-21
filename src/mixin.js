import { playSound } from "@/lib";
import { service } from "@/service";
import $ from "jquery";

const mixin = {
  data() {
    return {};
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
