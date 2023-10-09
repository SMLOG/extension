<template>
  <div
    style="
      background: red;
      position: absolute;
      width: 100%;
      left: 0;
      right: 0;
      z-index: 10000;
      top: 0;
      height: 30px;
      color: wheat;
    "
  >
    <div
      style="position: absolute; top: 0; left: 0; width: 100vw; height: 100%"
    >
      <div
        class="clip"
        style="
          width: 40px;

          position: absolute;
          top: 0;
          left: 20px;
          height: 100%;
        "
        @click="index = i"
        v-for="(c, i) in clips"
        :key="i"
        :style="clipstyle(c, i)"
        :class="{ cur: i == index }"
      ></div>
    </div>
    <div style="left: 0; top: 200%; position: absolute">
      <div
        style="
          display: flex;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
        "
      >
        name<input v-model="clips[index].name" />
        <span @click="to(clips[index].from)">from:</span>
        <input
          v-model.number="clips[index].from"
          @click="select = 'from'"
          :class="{ cur: select == 'from' }"
        />
        <span @click="to(clips[index].to)">to:</span>
        <input
          v-model.number="clips[index].to"
          @click="select = 'to'"
          :class="{ cur: select == 'to' }"
        />
        <span>{{ numfmt(clips[index].to - clips[index].from) }}</span>
      </div>
      <div
        style="
          display: flex;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
        "
      >
        <a @click="addclip">new</a>
        <a @click="time()">time</a>
        <a @click="cmd">command</a>
      </div>
    </div>
    <div></div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      clips: [
        {
          name: "",
          from: 0,
          to: 0,
        },
      ],
      select: "from",
      index: 0,
      filename: "",
    };
  },

  mounted() {},
  methods: {
    numfmt(ss) {
      let s = Math.floor(ss % 60);
      let m = Math.floor((ss / 60) % 60);
      let h = Math.floor(ss / 60 / 60);
      h = ("0" + h).substr(-2);
      m = ("0" + m).substr(-2);
      s = ("0" + s).substr(-2);
      return `${h}:${m}:${s}`;
    },
    to(t) {
      let v = document.querySelector("video[name=media]");
      v.currentTime = t;
    },
    cmd() {
      let str = this.clips
        .map((c) => {
          return `ffmpeg -ss ${this.numfmt(c.from)} -i  ${
            location.pathname
          } -t ${this.numfmt(
            c.to - c.from
          )} -c copy ${c.name.trim()}-${this.numfmt(c.to - c.from)
            .substr(-5)
            .replace(":", ".")}.mp4`;
        })
        .join("\n");
      console.log("\n\n" + str);

      navigator.clipboard.writeText(str);
    },
    time() {
      let v = document.querySelector("video[name=media]");
      this.clips[this.index][this.select] = v.currentTime;
    },
    clipstyle(c) {
      let v = document.querySelector("video[name=media]");
      let unit = window.innerWidth / v.duration;
      return { left: c.from * unit + "px", right: c.to * unit + "px" };
    },
    addclip() {
      let from = document.querySelector("video[name=media]").currentTime;

      this.clips.push({ name: "", from: from, to: from });
      this.index = this.clips.length - 1;
    },
  },
  watch: {},
};
</script>
<style lang="scss" scoped>
.clip {
  background: blue;
}
.clip.cur {
  background: yellow;
}
.cur {
  color: red;
}
</style>
