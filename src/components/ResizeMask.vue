<template>
  <div style="height: 100%; width: 100%; position: absolute; top: 0">
    <vdr
      :w="width"
      :h="height"
      :x="x"
      :y="y"
      :parent="true"
      :debug="false"
      :isConflictCheck="true"
      :snap="true"
      :snapTolerance="20"
      style="background: rgba(0, 0, 0, 1); border: none"
    >
    </vdr>
  </div>
</template>

<script>
import vdr from "vue-draggable-resizable-gorkys";
import "vue-draggable-resizable-gorkys/dist/VueDraggableResizable.css";
import $ from "jquery";
export default {
  components: { vdr },
  mounted() {
    console.log("he");
    this.y =
      ($(".videoCon").height() ||
        (Math.min($(window).width(), $(window).height()) * 9) / 16) * 0.865;
    this.width = ($(".videoCon").width() || $(window).width()) * 0.8;
    this.x = ($(".videoCon").width() || $(window).width()) * 0.1;
    this.height =
      (16 *
        ($(".videoCon").height() ||
          Math.min($(window).width(), $(window).height()))) /
      232;
  },
  data: function () {
    return {
      width: 200,
      height: 16,
      x: 0,
      y: 0,
    };
  },
  methods: {
    onResize: function (x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    },
    onDrag: function (x, y) {
      console.error(x, y);
      this.x = x;
      this.y = y;
    },
  },
};
</script>
