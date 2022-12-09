import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    loading: 0,
    curPlay: null,
    srcText: "",
    tranText: "",
    audioUrl: "",
    curTab: "HelloWorld",
    newword: "",
    showApp: 1,
    hkdcny: { now: "", p: "" },
    config: {
      shownews: 0,
      showvideos: 0,
      showwords: 0,
      autoSound: 0,
      mj: 0,
      preload: 0,
      dict: 0,
      news: 0,
    },
    curItem: {
      q: "",
      to: "",
      n: 0,
      dt: 0,
      am: "",
      en: "",
      parts: [],
      error: "",
      errorUrl: "",
      src: "",
      tos: [],
    },
    words: [],
    videos: [],
    news: [],
  },
  mutations: {
    hkdcny(state, hkdcny) {
      state.hkdcny = hkdcny;
    },
    curPlay(state, item) {
      state.curPlay = item;
    },
    setSrcText(state, text) {
      state.srcText = text;
    },
    setTranText(state, text) {
      state.tranText = text;
    },
    setAudioUrl(state, url) {
      state.audioUrl = url;
    },
    setCurTab(state, tab) {
      state.curTab = tab;
    },
    setNewword(state, newword) {
      state.newword = newword;
    },
    setShowApp(state, bool) {
      state.showApp = bool;
    },

    setLoading(state, bool) {
      state.loading = bool;
    },
    setCurItem(state, item) {
      state.curItem = item;
    },
    setCurItem2(state, item) {
      /* for (var i = 0; i < item.tos.length; i++) {
        Object.assign(item, item.tos[i]);
      }*/
      // Object.assign(item, item.tos.filter((e) => e.to)[0]);
      state.curItem = item;
      //Object.assign(state.curItem, item);
    },
    words(state, words) {
      state.words = words;
    },
    videos(state, videos) {
      let ctime = +new Date() - 604800000;

      let session = sessionStorage;
      if (session.doneVideoMap) {
        let doneVideoMap = JSON.parse(session.doneVideoMap);

        for (let k in doneVideoMap) {
          if (doneVideoMap[k] < ctime) delete doneVideoMap[k];
        }
        session.doneVideoMap = JSON.stringify(doneVideoMap);
        if (videos)
          for (let item of videos.filter((e) => !e._d)) {
            item._d = doneVideoMap[item.vid] || 0;
          }
      }

      state.videos = videos;
    },
    news(state, news) {
      state.news = news;
    },
    config(state, config) {
      state.config = Object.assign({}, config);
    },
    newWord(state, word) {
      let k = -1;
      for (let i = 0; i < state.words.length; i++) {
        if (state.words[i].q == word.q) {
          k = i;
          break;
        }
      }
      if (k > -1) {
        state.words.splice(k, 1);
      }
      state.words.unshift(word);
    },
  },
  actions: {},
  modules: {},
  getters: {
    showNews: (state) => state.config.showNews,
  },
});
