import Axios from "axios";
import { htmlTrans } from "./HtmlTrans";
import $ from "jquery";
import storejs from "storejs";
import bus from "@/bus";
//const audio = new Audio();
import { translate, isBackground } from "./translator";
import { getVideos } from "@/config";

const DataRep = "SMLOG";
const httpsRep = "https://smlog.github.io/data/";
const pako = require("pako");

window.pako = pako;
const RWORD = "words";
const NWORD = "nwords";
//import sounds from "@/../public/3s.mp3";
//console.log(sounds);
const jsonparse = JSON.parse;
let mya = $(`<iframe id="myaudio" style="display:none;"/>`);
mya.appendTo("body");
let ifr = mya[0];
window.pako = pako;
window.storejs = storejs;
let currentDoc = ifr.contentDocument || ifr.contentWindow.document;
currentDoc.body.innerHTML = `<audio id="sound" controls "></audio>
<audio id="bg" controls   ></audio>`;

let audio = currentDoc.querySelector("audio#sound");
let bgAudio = currentDoc.querySelector("audio#bg");

Axios.defaults.timeout = 5000;

const translators = [
  async (content) => {
    //yaoudao

    let type = isBackground() ? "json" : "jsonp";
    return await new Promise((resolve, reject) => {
      $.ajax({
        url: `https://fanyi.youdao.com/openapi.do`,
        type: "GET",
        data: {
          keyfrom: "wangtuizhijia",
          key: "1048394636",
          type: "data",
          doctype: type,
          version: "1.1",
          q: content.q,
        },
        dataType: type,
        success: function (data) {
          if (data.errorCode == 0) {
            let ret = {
              to: data.translation[0],
              q: data.query,

              src: "YD",
            };
            if (data.basic) {
              ret.am = data.basic["uk-phonetic"];
              ret.en = data.basic["us-phonetic"];
            }
            resolve(ret);
          } else reject(data);
        },
        error: function (err) {
          // reject("error when get dict from " + url);
          resolve(err);
        },
      });
    });
  },
  async (content) => {
    return await translate(content.q);
  },

  async (content) => {
    let ret = {};
    ret.src = "Dict";
    ret.q = content.q;
    let local = false;

    if (local) {
      Object.assign(ret, local);
    } else {
      let r = await ifr.contentWindow
        .fetch(
          `https://dict.iciba.com/dictionary/word/suggestion?word=${encodeURIComponent(
            content.q
          )}&nums=1&timestamp=0&is_need_mean=1`,
          {
            mode: "cors",
          }
        )
        .then((r) => r.json());

      console.log(r);
      if (r.message.length > 0) {
        ret.to =
          r.message[0].paraphrase ||
          r.message[0].means.reduce((str, it) => {
            return str + it.part + " " + it.means.join(",");
          }, "");
        // storejs.set(r.message[0].key, { q: ret.q, to: ret.to });
      }
    }
    console.log(ret);
    return ret;
  },
];

export function GetSelectedText() {
  if (document.getSelection) {
    // all browsers, except IE before version 9
    var sel = document.getSelection();
    // sel is a string in Firefox and Opera,
    // and a selectionRange object in Google Chrome, Safari and IE q version 9
    // the alert method displays the result of the toString method of the passed object
    return sel;
  } else {
    if (document.selection) {
      // Internet Explorer before version 9
      var textRange = document.selection.createRange();
      return textRange.text;
    }
  }
}

export function getTextNodesIn(node, includeWhitespaceNodes) {
  /**
   $(el).find(":not(iframe)").addBack().contents().filter(function() {
        return this.nodeType == 3;
    });
   */
  var textNodes = [],
    nonWhitespaceMatcher = /\S/;
  function getTextNodes(node) {
    if (node.nodeType == 3) {
      if (includeWhitespaceNodes || nonWhitespaceMatcher.test(node.nodeValue)) {
        textNodes.push(node);
      }
    } else {
      for (var i = 0, len = node.childNodes.length; i < len; ++i) {
        getTextNodes(node.childNodes[i]);
      }
    }
  }
  getTextNodes(node);
  return textNodes;
}
export function transHtml() {
  let selectors = [];

  $(function () {
    $("html > head").append(
      $(
        `<style type = "text/css">
        .newWorda{ color: #f73131!important;} 
        .newWordb{ margin-left: 5px;color:brown!important;}
        .mousedown .mouseenter .newWordb  {
          display: none;
        }</style>`
      )
    );
  });
  if (!storejs.get("transHtml")) return;
  /*  if (location.href.indexOf("cnn.com") > -1) selector = ".zn-body__paragraph";
  else if (location.href.indexOf("globaltimes.cn") > -1)
    selector = ".article .article_right";*/

  let textNodes = getTextNodesIn(document.body, 0).filter(
    (e) =>
      ["DIV", "P", "H1", "H2", "H3", "H4", "TD", "LI"].indexOf(
        e.parentElement.tagName
      ) > -1 && e.nodeValue.trim().length > 50
  );
  textNodes.map((e) => {
    selectors.push($(e.parentElement));
  });
  if (selectors.length > 0)
    $(function () {
      service(
        null,
        { cmd: "lists", type: RWORD, reqId: new Date().getTime() },
        (resp) => {
          if (resp && resp.contents && resp.contents.length > 0)
            setTimeout(() => {
              selectors.forEach((selector) => {
                var el = $(selector);
                if (!el.attr("newword")) {
                  el.each(function () {
                    var html = $(this).html();
                    if (/[\u4e00-\u9fa5]/.test(html)) return false;
                    console.log(html);
                    html = htmlTrans(resp.contents, html);
                    console.log(html);
                    $(this).html(html);
                  });
                  el.data("newword", true);
                }
              });
            }, 3000);
          // console.log(dict);
        }
      );
    });
}

const callbacks = {};
if (isBackground() /*&& location.protocol != "chrome-extension:"*/) {
  window.onMessageListener = function (request, sender, sendResp) {
    if (request && request.cmd) {
      console.log(
        sender.tab
          ? "from a content script:" + sender.tab.url
          : "from the extension"
      );
      //
      let cb = callbacks[request.reqId || request.cmd];
      if (cb) cb(request.contents);
    }
    sendResp(request.contents);
  };
  chrome.runtime.onMessage.addListener(window.onMessageListener);
}

export function service(tab, request, sendResponse) {
  let interpreter = (resp) => {
    if (resp && resp.error) {
      bus.$emit("error", resp);
    }
    let respfun = sendResponse;
    respfun(resp);
  };
  console.log("isBackground():" + isBackground());
  if (isBackground()) {
    callbacks[request.reqId || request.cmd] = interpreter;

    return chrome.runtime.sendMessage(tab, request, interpreter);
  } else {
    return callService(tab, request, interpreter);
  }
}
let serviceMap = {
  token: (request, sendResponse) => {
    var auth = "token " + request.content;

    fetch("https://api.github.com/user", {
      method: "get",
      headers: {
        accept: "application/vnd.github.v3+json",
        Authorization: auth,
      },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.name) storejs.set("token", request.content);
        sendResponse(json);
      });
  },

  lists: async (request, sendResponse) => {
    let ret = {};
    let cnt = 0;

    await canRefresh(request.type, request.force, () => {
      cnt++;
      setTimeout(() => {
        (async () => {
          await LOADERS[request.type](request, sendResponse);
          cnt--;
          sendResponse({ done: !cnt });
        })();
      }, 1000);
    });
    if (request.type == RWORD) {
      let words = loadUnGZipStore(request.type) || [];

      //remove not cancel new
      for (let d = 0, len = words.length; d < len; d++) {
        if (!words[d].i && !words[d].n) {
          words.splice(d, 1);
          len--;
          d--;
        }
      }

      gzipAndStore(request.type, words);

      ret.contents = loadUnGZipStore(request.type) || [];
      let nwords = loadUnGZipStore(NWORD, 1) || [];
      ret.contents.unshift(...nwords);
    } else ret.contents = loadUnGZipStore(request.type) || [];

    ret.done = !cnt;
    sendResponse(ret);
  },
  newWord: async (request, sendResponse) => {
    let ret = {};
    request.content.q = request.content.q.trim();
    if (!request.content.q) {
      ret.error = "empty word";
      sendResponse(ret);
      return;
    }

    let rcache = loadUnGZipStore(RWORD) || [];
    let ncache = loadUnGZipStore(NWORD, 1) || [];
    let q = request.content.q.toLocaleLowerCase();
    let arr = [ncache, rcache];
    for (let d = 0; d < arr.length; d++) {
      let cache = arr[d];
      for (var k = 0, len = cache.length; k < len; k++) {
        if (cache[k].q == q) {
          cache.splice(k, 1);
          console.log("remove q cache:" + q);
          k--;
          len--;
          if (d == 1) gzipAndStore(RWORD, rcache);
          d = arr.length;

          break;
        }
      }
    }

    ncache.unshift(Object.assign({}, request.content, { q: q }));
    try {
      gzipAndStore(NWORD, ncache, 1);
    } catch (e) {
      alert(e);
    }

    ret.contents = request.content;
    sendResponse(ret);
  },
  translate: (request, sendResponse) => {
    let rets = [];

    translators.map((e) =>
      e(request.content).then((ret) => {
        rets.push(ret);

        sendResponse(rets);
      })
    );
  },
  bg: (request) => {
    if (request.pause) {
      // bgAudio.pause();
    } else {
      bgAudio.currentTime = 0;
      // bgAudio.play();
    }
  },
  audio: (request, sendResponse) => {
    if (request.pause) {
      audio.pause();
      //bgAudio.pause();
      sendResponse({});
      return false;
    }
    let TTS = "https://fanyi.baidu.com";

    audio.title = request.content.trim();
    currentDoc.title = audio.title;
    let speed = request.speed || 5;
    let src = `${TTS}/gettts?lan=${
      request.lang || "en"
    }&text=${encodeURIComponent(request.content)}&spd=${speed}&source=web`;
    audio.src = src;

    // console.log(audio.src);
    //audio.load();
    //bgAudio.pause();
    audio.play();
    if (request.wait) {
      audio.onerror = audio.onended = function () {
        //bgAudio.play();
        sendResponse({});
      };
      return true;
    } else {
      sendResponse({});
      return false;
    }
  },

  setConfig: (request, sendResponse) => {
    storejs.set("config", request.content);
    sendResponse(getConf());
  },
  getConfig: (request, sendResponse) => {
    sendResponse(getConf());
  },
  content: (request, sendResponse) => {
    loadNewContent(request, sendResponse);
  },
  urls: (request, sendResponse) => {
    loadMjUrls(request, sendResponse);
  },
  mUpload: (request, sendResponse) => {
    (async () => {
      let resp = await uploadData();
      sendResponse(resp);
    })();
  },
};
function getConf() {
  return storejs.get("config") || {};
}
export function callService(tab, request, sendResp) {
  let sendResponse = (resp) => {
    if (isBackground()) {
      // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log(resp);
      chrome.tabs.sendMessage(
        tab.tab.id,
        // tabs && tabs.length > 0 && tabs[0].id,
        { cmd: request.cmd, reqId: request.reqId, contents: resp },
        function (response) {
          console.log(response);
          // console.log(response.farewell);
        }
      );
      // });
    } else sendResp(resp);
  };
  if (serviceMap[request.cmd]) {
    (async () => {
      await serviceMap[request.cmd](request, sendResponse);
    })();
  }

  return true;
}
const fetchRequest = (url, params = {}, timeout = 10000) => {
  let isTimeout = false;

  return new Promise(function (resolve, reject) {
    const TO = setTimeout(function () {
      isTimeout = true;
      reject(new Error("Fetch timeout"));
    }, timeout);

    fetch(url, params)
      .then((res) => {
        clearTimeout(TO);
        if (!isTimeout) {
          resolve(res);
        }
      })
      .catch((e) => {
        if (isTimeout) {
          return;
        }
        reject(e);
      });
  });
};

async function canRefresh(type, force, fn) {
  let ct = new Date().getTime();
  let config = getConf();
  if (!config["show" + type]) return;
  let key = "_" + type;

  let v = storejs.get(key) || 0;
  if (force || ct - v > 1800000) {
    await fn();
    storejs.set(key, ct);
  }
}

export async function getBlobContent(name, rep, path, sha, cacheTime) {
  let token = storejs.get("token");
  var auth = "token " + token;

  let headers = {
    accept: "application/vnd.github.v3+json",
  };
  if (token) headers["Authorization"] = auth;
  let url =
    `https://api.github.com/repos/${name}/${rep}/contents/${path}` +
    (sha ? `?ref=${sha}` : "");

  url += cacheTime
    ? (url.indexOf("?") > -1 ? "&" : "?") + `cache=${cacheTime}`
    : "";
  let json = await fetchRequest(
    url,
    {
      method: "get",
      headers: headers,
      // cache: "force-cache",
    },
    10000
  ).then((r) => r.json());

  return json.content;
}

async function forEachCommitsAsc(
  { name, rep, path, since },
  cb,
  decode = true
) {
  var commitsUrl = `https://api.github.com/repos/${name}/${rep}/commits?path=${encodeURIComponent(
    path
  )}&per_page=100`;
  if (since) commitsUrl += "&since=" + encodeURIComponent(since);

  let token = storejs.get("token");
  var auth = "token " + token;

  let headers = {
    accept: "application/vnd.github.v3+json",
  };
  if (token) headers["Authorization"] = auth;
  let curPage = 1;
  let commits = [];
  for (;;) {
    let pageCommits = await fetch(commitsUrl + "&page=" + curPage, {
      method: "get",
      headers: headers,
    }).then((response) => {
      if (response.status == 200) return response.json();
      else throw response;
    });
    commits.unshift(...pageCommits.reverse());
    if (pageCommits.length < 100) break;
    curPage++;
  }

  for (let i = 0; i < commits.length; i++) {
    let commit = commits[i];
    let content = await getBlobContent(name, rep, path, commit.sha);

    if (await cb(commit, decode ? b64_to_utf8(content) : content, i)) return;
  }
  return commits;
}

async function forEachCommits({ name, rep, path, since }, cb, decode = true) {
  var commitsUrl = `https://api.github.com/repos/${name}/${rep}/commits?path=${encodeURIComponent(
    path
  )}&per_page=100`;
  if (since) commitsUrl += "&since=" + encodeURIComponent(since);

  let token = storejs.get("token");
  var auth = "token " + token;

  let headers = {
    accept: "application/vnd.github.v3+json",
  };
  if (token) headers["Authorization"] = auth;
  let curPage = 1;
  let commits = [];
  for (;;) {
    let pageCommits = await fetch(commitsUrl + "&page=" + curPage, {
      method: "get",
      headers: headers,
    }).then((response) => {
      return response.json();
    });
    commits.push(...pageCommits);
    if (pageCommits.length < 100) break;
    curPage++;
  }

  for (let i = 0; i < commits.length; i++) {
    let commit = commits[i];
    let content = await getBlobContent(name, rep, path, commit.sha);

    if (await cb(commit, decode ? b64_to_utf8(content) : content, i)) return;
  }
  return commits;
}

async function updateRepFile(name, rep, path, content, gzip) {
  let token = storejs.get("token");
  var auth = "token " + token;
  var url = `https://api.github.com/repos/${name}/${rep}/contents/${path}`;

  if (!token)
    return {
      error: "token?",
    };
  let json = await fetch(url, {
    method: "get",
    headers: {
      accept: "application/vnd.github.v3+json",
    },
  }).then((r) => r.json());
  let sha = json.sha;
  json = await fetch(url, {
    method: "put",
    body: JSON.stringify({
      message: "update" + new Date(),
      branch: "main",
      content: utf8_to_b64(gzip ? gZip(content) : content),
      sha: sha,
    }),
    headers: {
      accept: "application/vnd.github.v3+json",
      Authorization: auth,
    },
  }).then((response) => {
    return response.json();
  });

  return json;
}

async function fetchvideos() {
  let videos = loadUnGZipStore("videos") || [];

  let exitMap = videos.reduce((map, item) => {
    map[item.vid] = 1;
    return map;
  }, {});

  let rVideos = await getVideos();
  for (let i = 0; i < rVideos.length; i++) {
    let item = rVideos[i];
    if (exitMap[item.vid]) continue;

    videos.unshift(item);
  }
  videos.sort((a, b) => b.dt - a.dt);
  videos.length = Math.min(500, videos.length);

  gzipAndStore("videos", videos);
  return videos;
}

function utf8_to_b64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(base64) {
  return decodeURIComponent(escape(atob(base64)));

  // return atob(str);
}

const LOADERS = {
  words: async (request, sendResponse) => {
    let config = getConf();

    console.log("syn with remote");
    let name = DataRep;
    let rep = "data";
    let path = "update.json";
    let sinceName = request.type + "Since";

    let words = loadUnGZipStore(RWORD) || [];
    let nwords = loadUnGZipStore(NWORD, 1) || [];
    let lastSyncDate = storejs.get(sinceName);

    let ts = +new Date();

    try {
      let updateIndex = await fetch(httpsRep + "updateIndex.json?t=" + ts).then(
        (r) => r.json()
      );

      if (updateIndex.date > lastSyncDate) {
        let updateData = await fetch(httpsRep + "updateData.json?t=" + ts).then(
          (r) => r.json()
        );

        if (updateIndex.gz) {
          updateData.words = jsonparse(
            pako.ungzip(atob(updateData.words), {
              to: "string",
            })
          );
        }
        words = updateData.words;
        lastSyncDate = updateIndex.date;
      } else if (
        new Date(lastSyncDate).getTime() -
          new Date(updateIndex.date).getTime() >
        1000 * 3600 * 24 * 10
      ) {
        await uploadData();

        updateIndex = await fetch(httpsRep + "updateIndex.json?t=" + ts).then(
          (r) => r.json()
        );

        lastSyncDate = updateIndex.date;
      }
    } catch (e) {
      console.error("error:" + e);
    }

    let since = lastSyncDate;
    let newList = nwords
      .filter((e) => (!e.i && e.n) || (e.i && !e.n))
      .map((e) => {
        for (let p in e) p[0] == "_" && delete e[p];
        return e;
      });

    let temps = [];
    let ret = {};

    let sinceTime = since;
    try {
      await forEachCommitsAsc(
        { name: name, rep: rep, path: path, since: sinceTime },
        (commit, content) => {
          console.log(commit);
          lastSyncDate = commit.commit.committer.date;

          let data = jsonparse(content);
          sinceTime = commit.commit.committer.date;
          temps.push(...data);
        }
      );
    } catch (e) {
      console.error(e);
      ret.error = e;
    }

    words.unshift(...temps.reverse());
    //words.unshift(...newList);

    let tm = {};

    let arr = [nwords, words];
    for (let d = 0; d < arr.length; d++) {
      let items = arr[d];
      for (let j = 0, len = items.length; j < len; j++) {
        let w = items[j];
        if (!w.q || tm[w.q] || !w.n) {
          items.splice(j, 1);
          len--;
          j--;
        }

        tm[w.q] = (tm[w.q] || 0) + 1;
      }
    }

    gzipAndStore(RWORD, words);
    gzipAndStore(NWORD, nwords, 1);

    let allWords = nwords.concat(words);

    if (lastSyncDate)
      storejs.set(
        sinceName,
        new Date(new Date(lastSyncDate).getTime() + 1000).toISOString()
      );
    if (config.fzWords > 0 && newList.length > config.fzWords) {
      console.log(newList);
      let rnewList = newList.map((e) => {
        let obj = Object.assign({}, e, { i: 1 });
        delete obj["errorUrl"];
        // delete obj["n"];
        return obj;
      });
      let content = JSON.stringify(rnewList);
      console.log(content);
      if (rnewList.length > 0) {
        let json = await updateRepFile(name, rep, path, content);
        console.log(json);

        ret.error = json.error;

        if (json.commit) {
          lastSyncDate = new Date(
            new Date(json.commit.committer.date).getTime() + 1000
          ).toISOString();
          storejs.set(sinceName, lastSyncDate);

          words.unshift(...rnewList);
          gzipAndStore(RWORD, words);

          nwords.length = 0;
          gzipAndStore(NWORD, nwords, 1);
          allWords = words;
        }
      }
    }

    ret.contents = allWords;
    sendResponse(ret);
  },
  news: async (request, sendResponse) => {
    let name = DataRep;
    let rep = "data";
    let path = "l.json";
    let sinceName = request.type + "Since";

    let since = storejs.get(sinceName);
    let news = loadUnGZipStore(request.type) || [];

    let temps = [];
    let error;
    let commits = await forEachCommits(
      { name, rep, path, since },
      (commit, content, i) => {
        if (i == 0) since = commit.commit.committer.date;
        if (!content) return;
        let compressed = tryUngzip(content);
        let data = jsonparse(compressed);
        temps.push(...data);
        if (temps.length > 500) return true;
      },
      false
    );
    let map = news.reduce((map, e) => {
      map[e.p] = 1;
      return map;
    }, {});

    news.unshift(...temps.filter((e) => !map[e.p]));

    news.sort((a, b) => parseInt(b.date) - parseInt(a.date));

    storejs.set(sinceName, since);

    let ret = {};
    ret.error = error || commits.message;
    ret.contents = news;
    news.length = Math.min(500, news.length);
    gzipAndStore(request.type, news);
    sendResponse(ret);
  },
  videos: async (reqeust, sendResp) => {
    let name = DataRep;
    let rep = "data";
    let path = "v1.json";
    let videos = await fetchvideos();
    let sinceName = reqeust.type + "Since";
    let since = storejs.get(sinceName);
    let error;
    let temps = [];

    let config = getConf();

    if (videos.length == 0) since = 0;

    sendResp({ contents: videos });

    try {
      /*
      await forEachCommits(
        { name, rep, path, since },
        (commit, content, i) => {
          if (i == 0) since = commit.commit.committer.date;
          let compressed = content;
          if (!compressed) return;
          compressed = tryUngzip(content);

          let data = jsonparse(compressed);

          temps.push(...data);
        },
        0
      );*/

      videos.unshift(...temps);

      let eMap = {};
      for (let i = 0, len = videos.length; i < len; i++) {
        if (eMap[videos[i].vid]) {
          videos.splice(i, 1);
          i--;
          len--;
        } else eMap[videos[i].vid] = 1;
      }
      videos.sort((a, b) => b.dt - a.dt);

      gzipAndStore(reqeust.type, videos);

      if (since)
        storejs.set(
          sinceName,
          new Date(new Date(since).getTime() + 1000).toISOString()
        );
      let sn = new Date().getTime() - 5 * 24 * 3600 * 1000;
      let newItems = videos.filter((v) => !v.i && v.dt > sn);
      console.log(newItems.length);
      if (config.fzVideos > 0 && newItems.length >= config.fzVideos) {
        let json = await updateRepFile(
          name,
          rep,
          path,
          JSON.stringify(
            newItems.map((e) => {
              for (let p in e) p[0] == "_" && delete e[p];
              return Object.assign(
                {
                  i: 1,
                },
                e
              );
            })
          ),
          1
        );

        if (json.commit) {
          newItems.map((e) => (e.i = 1));
          gzipAndStore(reqeust.type, videos);

          storejs.set(
            sinceName,
            new Date(
              new Date(json.commit.committer.date).getTime() + 1000
            ).toISOString()
          );
        }
        error = json.error;
      }
    } catch (e) {
      error = e;
      console.error(e);
    }
    sendResp({ error: error, contents: videos });
  },
};

async function loadNewContent(request, sendResponse) {
  await getBlobContent(DataRep, "data", request.content.p).then((content) => {
    let compressed = b64_to_utf8(content);
    compressed = unGzip(content); /*pako.ungzip(window.atob(content), {
      to: "string",
    });*/
    sendResponse({ content: compressed });
  });
}

async function loadMjUrls(request, sendResponse) {
  await getBlobContent(
    DataRep,
    "data",
    request.content.p,
    0,
    request.content.cache
  )
    .then((content) => {
      // let compressed = atob(content);
      let compressed = pako.ungzip(window.atob(content), {
        to: "string",
      });
      sendResponse({ content: jsonparse(compressed) });
    })
    .catch(() => {
      sendResponse({ content: 0 });
    });
}
function unGzip(content) {
  return pako.ungzip(content, {
    to: "string",
  });
}
function gZip(content) {
  return pako.gzip(content, { to: "string" });
}

function tryUngzip(content) {
  let compressed;
  try {
    compressed = b64_to_utf8(content);
  } catch (ee) {
    console.error(ee);
    compressed = atob(content);
    // throw ee;
  }
  try {
    compressed = unGzip(compressed);
  } catch (e) {
    console.error(e);
  }
  return compressed;
}
function gzipAndStore(key, obj, notzip) {
  localStorage.setItem(
    key,
    notzip
      ? JSON.stringify(obj)
      : pako.gzip(JSON.stringify(obj), { to: "string", level: 9 })
  );
}
function loadUnGZipStore(key) {
  let raw = localStorage.getItem(key);

  return (
    raw &&
    jsonparse(
      raw[0] == "["
        ? raw
        : pako.ungzip(localStorage.getItem(key), { to: "string" })
    )
  );
}

async function uploadData() {
  let words = loadUnGZipStore(RWORD) || [];
  let nwords = loadUnGZipStore(NWORD, 1) || [];

  let newList = nwords
    .filter((e) => (!e.i && e.n) || (e.i && !e.n))
    .map((e) => {
      for (let p in e) p[0] == "_" && delete e[p];
      return e;
    });
  let rnewList = newList.map((e) => {
    return Object.assign({}, e, { i: 1 });
  });

  words.unshift(...rnewList);
  let allWords = nwords.concat(words);
  nwords.length = 0;

  let name = "smlog";
  let rep = "data";
  let json = await updateRepFile(
    name,
    rep,
    "updateData.json",
    JSON.stringify({
      words: allWords,
    })
  );
  if (json.commit)
    json = await updateRepFile(
      name,
      rep,
      "updateIndex.json",
      JSON.stringify({
        date: new Date(new Date().getTime() + 1000).toISOString(),
      })
    );
  if (json.commit) {
    gzipAndStore(RWORD, allWords);

    gzipAndStore(NWORD, nwords, 1);
    console.info("merge ok");
    return allWords;
  }
  return 0;
}
