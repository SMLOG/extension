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
    showApp: 0,
    showSidebar: 0,
    hkdcny: { now: "", p: "" },
    nextUrl: "",
    config2: {
      dev:0,
      mask: 0,
      showList: 0,
      touchstart: 0,
      playing: 0, //play words
      touchCustCue: 0,
      playingM: 0,
      videoUrl: "",
      playList:[],
      playIndex:-1,
      mediaType:0,
      mediaTypeText:''
    },
    config: {
      m3u8Repo:'',
      maxBitRate:0,
      waitTimes:2,
      playerNum:3,
      backplay: 0,
      editor: 0,
      playbackrate: 1,
      custCue: 0,
      seeCurWords: 0,
      maxTranLen: 300,
      viewMode: 0,
      loopCount: 3,
      isLoop: 0,
      isAudio: 1,
      fs: 2,
      hi: 0,
      keepNewsCount: 50,
      autoRefresh: 0,
      tranUrl: "",
      cacheMode: 0,

      lastclean: 0,
      retains: 200,
      activeTran: 1,
      shownews: 0,
      showvideos: 0,
      showwords: 0,
      autoSound: "",
      mj: 0,
      preload: 0,
      dict: 0,
      relwords: 0,
      timeoutnext: 0,
      audioCacheNum: 1,
      dockList: 0,
      rsss: [],
      urls: {},
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
  },
  mutations: {
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
    setShowSetting(state, bool) {
      state.showSidebar = bool;
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
    nextUrl(state, nextUrl) {
      state.nextUrl = nextUrl;
    },
    add2CurWords(state, [words, reset]) {
      if (reset) {
        state.curWords.length = 0;
        curWordsMap = {};
        if (state.config.seeCurWords) {
          state.config.seeCurWords += 1;
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
        if (videos) {
          for (let item of videos.filter((e) => !e._d)) {
            item._d = doneVideoMap[item.vid] || 0;
          }

          videos.filter((e) => !e._c && (e._c = 0));
        }
      }

      state.videos = videos;
    },
    news(state, news) {
      state.news = news;
    },
    config(state, config) {
      state.config = Object.assign({}, state.config, config);
    },
    config2(state, config) {
      state.config2 = Object.assign({}, state.config2, config);
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

      if (state.config.fzWords > 0) {
        let k = 0;
        for (
          let i = 0;
          i < state.words.length && i <= state.config.fzWords + 5;
          i++
        ) {
          if (state.words[i].n) {
            k++;
          }
        }
        if (k >= state.config.fzWords) {
          bus.$emit("fresh", "words", 1);
        }
      }
    },
  },
  actions: {},
  modules: {},
  getters: {
    showNews: (state) => state.config.showNews,
  },
});
