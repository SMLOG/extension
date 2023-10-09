import Vue from "vue";
import App from "./App.vue";
//import router from "./router";
import store from "./store";
import storejs from "storejs";
import axios from "storejs";
import infiniteScroll from "vue-infinite-scroll";
//import "./registerServiceWorker";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import mixin from "./mixin";
import "./requestAnimationFrame";
import {
  FontAwesomeIcon,
  FontAwesomeLayers,
  FontAwesomeLayersText,
} from "@fortawesome/vue-fontawesome";

library.add(fas, far, fab);

Vue.component("font-awesome-icon", FontAwesomeIcon);
Vue.component("font-awesome-layers", FontAwesomeLayers);
Vue.component("font-awesome-layers-text", FontAwesomeLayersText);

Vue.prototype.$http = axios;
Vue.prototype.$storejs = storejs;

Vue.use(infiniteScroll);
Vue.mixin(mixin);
new Vue({
  // router,
  store,
  render: (h) => h(App),
}).$mount("#mytranslate_app");
