<template>
  <div
    :class="{
      hover: dockList || isM() || isHover,
      isActivedTran: config.activeTran,
    }"
    :style="{ opacity:config.viewMode!=0 || isHover?1:0.01}"
    class="vb_1 is-fixed-bottom is-hidden-desktop"
    @mouseenter="(isHover = 1), updateConfig2({ showList: 1 })"
    @mouseleave="isHover = 0"
    @click="updateConfig2({ showList: 1 })"
    @touchmove="updateConfig2({ showList: 1 })"
    @touchstart="updateConfig2({ showList: 1 })"
    ref="listContainer"
  >
    <div ref="mediaList" class="listCon">
      <Video v-show="showList" @selectItem="showList = 0" />
    </div>
    <div
      class="columns has-text-centered is-mobile is-size-7 is-marginless is-paddingless"
      style="user-select: none"
    >
      <div class="column is-marginless" v-if="shownews">
        <span @click="showPlayer">Read</span>
      </div>

      <div class="column is-marginless" ref="mediaListText">
        <span
          class="button"
          style="margin-right: 10px; margin-left: 10px"
          :class="{ play: !config2.playingM, pause: config2.playingM }"
          @click="togglePlay()"
        ></span>
        <span
          @click="showList = !showList"
          style="flex-grow: 1"
          ref="showListBt"
          ><font-awesome-icon :icon="['fas', 'ellipsis']"
        /></span>
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

  created() {
    console.log(this.dockList);
  },
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
      if (
        this.$refs.listContainer &&
        !this.$refs.listContainer.contains(e.target)
      ) {
        this.updateConfig2({ showList: 0 });
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
.viewMode .vb_1{
  background: rgba(255,255,255,0.7);
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
  right: calc(15px - 100%);

  width: 100%;
  z-index: 11112 !important;
  padding: 0;
  margin: 0;
}

.viewMode .vb_1.is-fixed-bottom {
  transform: translateY(calc(100% - 2px));
  right: 0px !important;
}

.viewMode.showList .vb_1.is-fixed-bottom {
  z-index: 2000000 !important;
  transform: translateY(0);
  overflow: hidden;
}
.viewMode.showList .vb_1.is-fixed-bottom .listCon {
  max-height: calc(100vw - 40px);
  overflow: auto;
}
.viewMode .vb_1.is-fixed-bottom::before {
  content: "";
  position: absolute;
  top: -1em;
  height: 1em;
  left: 0;
  right: 0;
}
.viewMode.showList .vb_1.is-fixed-bottom::before {
  display: none;
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
  height: 40px;
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
.isActivedTran {
  border: 1px solid green !important;
}
</style>
