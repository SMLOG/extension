<template>
  <div>
    <div
      style="margin: 5px; width: 100%; background: rgba(255, 255, 255, 0.6)"
      v-if="config.editor"
      :style="{
        position: editpos == 'None' ? 'sticky' : 'fixed',
        top: editpos == 'Top' ? 0 : 'auto',
        bottom: editpos == 'Bottom' ? 0 : 'auto',
        zIndex: zIndex,
      }"
    >
      <div style="display: flex; justify-content: space-between">
        <div>
          <span
            v-for="b in bgs"
            :key="b"
            style="min-width: 10px; min-height: 10px; display: inline-block"
            @click="selectbg = b"
            :style="{
              background: b,
              border: selectbg == b ? '1px solid red' : '1px solid gray',
            }"
          >
          </span>
          <span style="margin-left: 20px; cursor: pointer" @click="clean()"
            >Clear</span
          >
        </div>

        <div style="display: flex">
          <div style="user-select: none">
            <span
              style="margin-right: 20px"
              @click="updateConfig({ activeTran: !config.activeTran })"
            >
              {{ config.activeTran ? "ON" : "OFF" }}</span
            >
            <span
              v-for="b in ['None', 'yellow', 'pink', 'lightgreen']"
              :key="b"
              style="
                min-width: 10px;
                min-height: 10px;
                display: inline-block;
                margin: 5px;
                cursor: pointer;
                border-bottom: 2px solid gray;
              "
              @click="highlightmark = b"
              :style="{
                background: b,

                borderColor: highlightmark == b ? 'red' : 'gray',
                borderWidth: highlightmark == b ? '2px ' : '0',
              }"
              >{{ b }}
            </span>
          </div>
          <div style="user-select: none">
            <span
              v-for="b in ['Top', 'Bottom', 'None']"
              :key="b"
              style="
                min-width: 10px;
                min-height: 10px;
                display: inline-block;
                margin: 5px;
                cursor: pointer;
              "
              @click="editpos = b"
              :style="{
                background: b,
                color: editpos == b ? 'red' : 'gray',
              }"
              >{{ b }}
            </span>
          </div>
        </div>
      </div>

      <div
        contenteditable="true"
        style="border: 2px dashed #ccc; padding: 5px"
        :style="{ background: selectbg }"
        ref="editor"
      ></div>
    </div>
  </div>
</template>
    <script>
import { highlightSelectedText } from "@/highlightMark";

export default {
  data() {
    return {
      zIndex: 0,
      highlightmark: "None",
      editpos: "None",
      selectbg: "none",
      bgs: ["none", "#f0f0f0"],
    };
  },
  methods: {
    clean() {
      confirm("Clean the content?") && (this.$refs.editor.innerHTML = "");
    },
  },
  mounted() {
    this.zIndex = +new Date();
    document.addEventListener("mouseup", (event) => {
      if (this.highlightmark != "None") {
        highlightSelectedText(this.highlightmark);
        event.stopPropagation();
      }
    });
  },
};
</script>