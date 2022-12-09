<template>
  <div
    :class="{ hover: isM() || isHover }"
    class="vb_1 is-fixed-bottom is-hidden-desktop"
    @mouseenter="isHover = 1"
    @mouseleave="isHover = 0"
  >
    <div ref="mediaList">
      <Video v-show="showList" @selectItem="showList = 0" />
    </div>
    <div
      class="columns has-text-centered is-mobile is-size-7 is-marginless is-paddingless"
      style="user-select: none"
    >
      <div class="column is-marginless">
        <span @click="showPlayer">Detail</span>
      </div>
      <div id="footer-play-button" class="column is-marginless">
        <span
          class="button"
          :class="{ play: !playing, pause: playing }"
          @click="togglePlay()"
        ></span>
      </div>

      <div class="column is-marginless" ref="mediaListText">
        <span @click="showList = !showList">List</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Video from "./MediaList.vue";
import bus from "@/bus";

function isMobile() {
  let mobile = navigator.userAgent.match(
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
  );
  return mobile != null;
}
export default {
  data() {
    return {
      show: 0,
      showList: 0,
      isHover: 0,
    };
  },
  props: ["playing"],

  created() {},
  computed: {
    ...mapState(["curItem", "words"]),
  },
  components: { Video },
  methods: {
    isM() {
      return isMobile();
    },

    togglePlay() {
      bus.$emit("togglePlay");
    },
    showPlayer() {
      bus.$emit("showPlayer");
    },
  },
  mounted() {
    let clickHandler = (e) => {
      if (this.$refs.mediaList) {
        if (
          !this.$refs.mediaList.contains(e.target) &&
          !this.$refs.mediaListText.contains(e.target)
        ) {
          this.showList = false;
        }
      }
    };
    let doc = document;
    doc.addEventListener("click", clickHandler);
    doc.addEventListener("touchend", clickHandler);
  },

  watch: {},
};
</script>

<style scoped>
.vb_1 {
  background-color: #fff;
  position: relative;
  z-index: 10001;
}
.vb_1.is-fixed-bottom {
  box-shadow: 0 -3px 15px #999;
  min-height: 40px;
}
.vb_1.is-fixed-bottom {
  bottom: 0;
}
.hover.vb_1.is-fixed-bottom {
  right: 0;
}
.vb_1.is-fixed-bottom,
.vb_1.is-fixed-top {
  position: fixed;
  right: calc(30px - 100%);

  width: 100%;
  z-index: 10001 !important;
  padding: 0;
  margin: 0;
}
.column {
  display: block;
  flex-basis: 0;
  flex-grow: 1;
  flex-shrink: 1;
  padding: 0.75rem;
}
.columns.is-mobile {
  display: flex;
}
.vb_1.is-fixed-bottom .column {
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.is-marginless {
  margin: 0 !important;
}

button {
  padding: 0;
  background-color: white;
  box-sizing: border-box;
}
.play {
  border-width: 14px 0 14px 28px;

  border-style: solid;
  border-color: transparent transparent transparent black;
}
.pause {
  border-style: double;
  border-width: 0px 0px 0px 40px;
  border-color: #202020;
  display: inline-block;
  height: 70%;
}
</style>
