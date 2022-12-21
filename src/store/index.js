import Vue from "vue";
import Vuex from "vuex";
import bus from "@/bus";

Vue.use(Vuex);

let curWordsMap = {};
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
    showCurWords: localStorage.showCurWords,
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
      relwords: 0,
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
    curWords: [],
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
      console.log("showapp");
      state.showApp = bool;
    },
    setShowCurWords(state, bool) {
      console.log("showCurWords");
      state.showCurWords = bool;

      localStorage.showCurWords = bool ? "1" : "";
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
    add2CurWords(state, [words, reset]) {
      if (reset) {
        state.curWords.length = 0;
        curWordsMap = {};
        if (state.showCurWords) {
          state.showCurWords += 1;
        }
      }

      for (let word of words) {
        if (!curWordsMap[word.q]) {
          curWordsMap[word.q] = 1;
          state.curWords.push(word);
        }
      }
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
      bus.$emit("newWord", word);
    },
  },
  actions: {},
  modules: {},
  getters: {
    showNews: (state) => state.config.showNews,
  },
});
