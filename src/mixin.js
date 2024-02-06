import { playSound, loadpkoData } from "@/lib";
import { service } from "@/service";
import $ from "jquery";
import { mapState } from "vuex";
import { encode } from "@/compress";
import bus from "@/bus";

const cacheBase = "cache/";

const mixin = {
  data() {
    return {};
  },
  methods: {
    emit(event) {
      bus.$emit(event)
    },
    updateConfig(config) {
      service(null, { cmd: "setConfig", content: Object.assign(this.config, config) }, () => {
        console.log('setConfig');
        this.$store.commit("config", this.config);
      });
    },
    updateConfig2(config) {
      this.$store.commit("config2", Object.assign(this.config2, config));

    },
    toggleSetting() {
      console.log("error");
      this.$store.commit("setShowSetting", !this.showSidebar);
    },
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

      let y =
        $el.offset().top +
        $parent[0].scrollTop -
        $parent.offset().top -
        $parent.height() +
        $el.outerHeight();

      window.cancelAnimationFrame(window.requestAnimationFrame1);
      window.requestAnimationFrame1 = window.requestAnimationFrame(() => {
        $($parent).animate({ scrollTop: y }, 500);
      });
      //  $($parent).animate({ scrollTop: y }, 1000);
    },
    async saveCache(modname, data) {
      let name = cacheBase + modname;
      console.log(name, data.length);
      // data.length = Math.min(100, data.length);

      let content = JSON.stringify(data);

      content = encode(content);

      if (modname == 'videos')
        localStorage[modname] = content;
      else sessionStorage[name] = content;

    },
    async delCache(modname) {
      let name = cacheBase + modname;
      return fetch(name, {
        method: "PUT",
        headers: { delete: 1 },
        //  keepalive: true,
      }).then((e) => {
        return e.json();
      });
    },
    async loadCache(modname) {
      return loadpkoData(modname);
    },
  },
  computed: {
    ...mapState(["showSidebar"]),

    config() {
      return this.$store.state.config;
    },

    autoHide() {
      return this.$store.state.config.autoHide;
    },
    shownews() {
      return this.$store.state.config.shownews;
    },
    config2() {
      return this.$store.state.config2;
    },
  },
};
export default mixin;
