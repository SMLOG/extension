<template>
  <div
    class="op_tool"
    @touchstart="onTouch(1)"
    :class="{ show: opacity, hide: !opacity }"
    @mouseover="onTouch()"
    @mouseout="onLeave(0)"
    @touchmove="onTouch()"
    ref="op_tool"
  >
    <div
      ref="mask"
      @touchstart.prevent
      @touchend.prevent
      @touchmove.prevent
      style="
        width: 150%;
        height: 100%;
        position: absolute;
        z-index: 1;
        user-select: none;
      "
      v-show="opacity < 1"
    ></div>
    <div class="icons">
      <span
        @click="togglePlayAndMode()"
        :class="{ playing: config2.playing }"
        >{{ playMode }}</span
      >
      <font-awesome-icon
        icon="volume-high"
        fixed-width
        v-show="config.seeCurWords && config2.playing"
        @click="updateConfig2({ playing: !config2.playing })"
        size="lg"
      ></font-awesome-icon>
      <font-awesome-icon
        @click="updateConfig2({ playing: !config2.playing })"
        icon="volume-xmark"
        fixed-width
        v-show="config.seeCurWords && !config2.playing"
        size="lg"
      ></font-awesome-icon>
      <font-awesome-icon
      @click="updateConfig({ viewMode: ++config.viewMode>2?0:config.viewMode })"
        icon="fa-solid fa-maximize"
        fixed-width
        size="lg"
        :class="{active:config.viewMode,left:config.viewMode==2}"
      />
 
      <font-awesome-icon
        @click="setShowCurWords(!config.seeCurWords)"
        :icon="['fas', 'list']"
        fixed-width
        size="lg"
        :class="{active:config.seeCurWords}"
      />
   

      <font-awesome-icon
        v-if="config.isAudio == 1"
        @click="clickAudio"
        :icon="['fas', 'headphones']"
        fixed-width
        size="lg"
      />
      <font-awesome-icon
        v-else-if="config.isAudio == 2"
        :icon="['fas', 'headphones-simple']"
        @click="clickAudio"
        fixed-width
        size="lg"
      />
      <font-awesome-icon
        v-else
        :icon="['fas', 'tv']"
        @click="clickAudio"
        fixed-width
        size="lg"
      />
     <font-awesome-icon
        :icon="['fas', 'closed-captioning']"
        @click="updateConfig({custCue:++config.custCue>2?0:config.custCue})"
        fixed-width
        size="lg"
        :class="{active:config.custCue,borderTop:config.custCue==2,borderBottom:config.custCue==1}"
      />
      <font-awesome-icon
        @click="toggleSetting()"
        icon="eye"
        fixed-width
        size="lg"
      />
      <a @click="changeRate()">{{ config.playbackrate }}</a>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      playMode: (localStorage.playMode && parseInt(localStorage.playMode)) || 0,
      curPlay: "",
      isSpell: false,
      playNum: 0,
      opacity: 0.1,
    };
  },
  created() {},
  computed: {},
  components: {},
  watch:{
    "$store.state.config2.mask": {
      handler(n) {
        if (!n ) { this.onLeave()
          
        }
      },
    },
  },
  methods: {
    changeRate(){

      this.config.playbackrate=(0.1+parseFloat(this.config.playbackrate)).toFixed(1);

      this.updateConfig({playbackrate:this.config.playbackrate>1?0.5:this.config.playbackrate})
    },
    clickAudio() {
      this.updateConfig({
        isAudio: this.config.isAudio >= 2 ? 0 : 1 + this.config.isAudio,
      });
    },
    onLeave() {
      this.opacity = 0;
      this.updateConfig2({mask:0})

    },
    onTouch() {
      this.opacity = 1;
      this.updateConfig2({mask:1})
    },
    togglePlayAndMode() {
      this.playMode++;
      if (this.playMode > 3) this.playMode = 0;
      localStorage.playMode = this.playMode;
    },
    setShowCurWords(b) {
      this.updateConfig({ seeCurWords: b });
      if (!b) this.updateConfig2({ playing: b });
    },
  },
  mounted() {
    let clickHandler = (e) => {
      if (this.$refs.op_tool) {
        if (!this.$refs.op_tool.contains(e.target)) {
          this.onLeave();
        }
      }
    };
    document.addEventListener("click", clickHandler);
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

.op_tool {
  position: fixed;
  right: -1.5em;
  bottom: 50px;
  cursor: pointer;
  width: 1em;
  z-index: 11112;
  user-select: none;
  background-color: white;
  transition: opacity 1s linear, right 1s linear, font-size 1s linear;
  opacity: 0.4;
  min-width: 1.5em;
  text-align: center;
}
.op_tool::before {
  content: "";
  position: absolute;
  top: 0;
  left: -1em;
  bottom: 0;
  width: 1em;
  border-left: 1px solid green;
  user-select: none;
}
.op_tool.show {
  transition: opacity 0s linear, font-size 0s linear;
  opacity: 1;
  font-size: 150%;
  right: 10px;
}
.op_tool > * {
  margin-bottom: 10px;
  user-select: none;
}
.playing {
  color: green;
  font-weight: bold;
}
.icons > * {
  margin-top: 10px;
}
.active{
  color:red;
  font-weight: bold;
}
.borderTop{
  border-top:2px solid green;
}
.borderBottom{
  border-bottom:2px solid green;
}
.left{
  border-left:2px solid green;
}
</style>
