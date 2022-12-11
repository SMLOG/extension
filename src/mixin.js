import { playSound } from "@/lib";
import { service } from "@/service";

const mixin = {
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
  },
};
export default mixin;
