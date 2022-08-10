<template>
  <div class="navbar is-fixed-bottom is-hidden-desktop">
    <div ref="mediaList">
      <Video v-show="showList" @selectItem="showList = 0" />
    </div>
    <div
      class="
        columns
        has-text-centered
        is-mobile is-size-7 is-marginless is-paddingless
      "
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

export default {
  data() {
    return {
      show: 0,
      showList: 0,
    };
  },
  props: ["playing"],

  created() {},
  computed: {
    ...mapState(["curItem", "words"]),
  },
  components: { Video },
  methods: {
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
.navbar {
  background-color: #fff;
  position: relative;
  z-index: 10001;
}
.navbar.is-fixed-bottom {
  box-shadow: 0 -3px 15px #999;
  min-height: 40px;
}
.navbar.is-fixed-bottom {
  bottom: 0;
}
.navbar.is-fixed-bottom,
.navbar.is-fixed-top {
  left: 0;
  position: fixed;
  right: 0;
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
.navbar.is-fixed-bottom .column {
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
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
