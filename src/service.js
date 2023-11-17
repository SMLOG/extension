import Axios from "axios";
import { htmlTrans } from "./HtmlTrans";
import $ from "jquery";
import storejs from "storejs";
import bus from "@/bus";
import { fetchRequest, loadpkoData } from "@/lib";
import { playAudio, SILENT } from "@/tts";

//import fetchJSONP from "fetch-jsonp";

//const audio = new Audio();
import { translate, isBackground } from "./translator";
import { getVideoPromiseList } from "@/config";
import { encode, decode } from "@/compress";

const pako = require("pako");

let updateconfig = 0;
//window.pako = pako;
const RWORD = "words";
const NWORD = "nwords";
let lastAutoSound = "";

const jsonparse = JSON.parse;
let mya = $(
  `<iframe id="myaudio" style="display:none;" referrerpolicy="no-referrer" />`
);
mya.appendTo("body");
let ifr = mya[0];

/*window.pako = pako;
window.storejs = storejs;
let currentDoc = ifr.contentDocument || ifr.contentWindow.document;
currentDoc.body.innerHTML = `<audio id="sound" controls ></audio>`;

//let audio = currentDoc.querySelector("audio#sound");*/
let currentDoc = window.document;
let audio = new Audio();
audio.setAttribute("referrerpolicy", "no-referrer");

Axios.defaults.timeout = 5000;

let audioListeners = [];

function responseAll() {
  while (audioListeners.length > 0) {
    let onRes = audioListeners.pop();
    onRes({});
  }
}

let json2jsonpProxy = async function (enable, url) {
  if (enable) {
    let jurl = `https://json2jsonp.com/?url=${encodeURIComponent(url)}`;
    return new Promise((resolve, reject) => {
      $.ajax({
        url: jurl,
        dataType: "jsonp",
        jsonp: "callback",
        jsonpCallback: "jsonpCb",
        cache: 1,
        success: (data) => {
          resolve(data);
        },
        error: (error) => {
          reject(error);
        },
      });
    });

    /* return await fetchJSONP(jurl, {
      timeout: 10000,
      mode: "cors",
    }).then((r) => r.json());*/
  } else {
    return await ifr.contentWindow
      .fetch(url, {
        mode: "cors",
      })
      .then((r) => r.json());
  }
};
const translators = [
  async (content) => {
    //yaoudao

    let type = isBackground() ? "json" : "jsonp";
    return await new Promise((resolve, reject) => {
      $.ajax({
        url: `https://fanyi.youdao.com/openapi.do`,
        type: "GET",
        jsonpCallback: "jcby",
        cache: 1,
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
            ret._raw = data;
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
      let r = await json2jsonpProxy(
        isBackground() ? 0 : 1,
        `https://dict.iciba.com/dictionary/word/suggestion?word=${encodeURIComponent(
          content.q
        )}&nums=1&timestamp=0&is_need_mean=1`
      );

      console.log(r);
      if (r.message.length > 0) {
        ret.to =
          r.message[0].paraphrase ||
          r.message[0].means.reduce((str, it) => {
            return str + it.part + " " + it.means.join(",");
          }, "");
        // storejs.set(r.message[0].key, { q: ret.q, to: ret.to });
        ret._raw = r;
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
  let config = getConf();

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
  if (!config || !config.transHtml) return;
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
  post: (request, sendResponse) => {
    sendResponse();
  },
  get: (request, sendResponse) => {
    sendResponse(storejs.get(request.name));
  },
  token: (request, sendResponse) => {
    console.error(request);
    if (request.content) {
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
          if (json.name) {
            storejs.set("token", request.content);
            storejs.set("user", json.name);
          }
          sendResponse(json);
        });
    } else {
      sendResponse(storejs.get("user"));
    }
  },

  lists: async (request, sendResponse) => {
    let ret = {};

    try {
      let cnt = 0;

      await canRefresh(request.type, request.force, () => {
        cnt++;
        setTimeout(() => {
          (async () => {
            if (LOADERS[request.type])
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
      } else {
        ret.contents = await loadpkoData(request.type); //loadUnGZipStore(request.type) || [];
      }

      ret.done = !cnt;
      sendResponse(ret);
    } catch (ee) {
      console.error(ee);
      // alert(ee);

      bus.$emit("error", ee);

      ret.done = 1;
      sendResponse(ret);
    }
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
        if (ret && ret._raw) {
          if (request.config && request.config.tranUrl)
            (async () => {
              delete ret._raw.logid;

              let content = encode(JSON.stringify(ret._raw));
              delete ret._raw;
              await fetch(request.config.tranUrl, {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  item: request.content,
                  resp: ret,
                  enc: JSON.stringify({ anc: content }),
                }),
              });
              // const content = await rawResponse.json();

              //console.log(content);
            })();
          else delete ret._raw;
        }

        sendResponse(rets);
      })
    );
  },
  audio: (request, sendResponse) => {
    audioListeners.push(sendResponse);
    if (request.pause || !request.content) {
      if (request.pause) {
        audio.pause();
      } else {
        if (!audio.inited) {
          audio.inited = 1;
          if (!audio.src) {
            audio.src = SILENT;
            audio.play();
          }
        }
        return;
      }
      responseAll();

      return false;
    }
    audio.title = request.title || request.content.trim();
    currentDoc.title = audio.title;
    let config = getConf();
    playAudio(config.autoSound, responseAll, request, audio);
  },
  audio2: (request, sendResponse) => {
    audioListeners.push(sendResponse);
    if (request.pause || !request.content) {
      if (request.pause) {
        audio.pause();
      } else {
        if (!audio.inited) {
          audio.inited = 1;
          audio.src = "3s.mp3";
          audio.play();
        }
      }
      responseAll();

      return false;
    }
    audio.title = request.content.trim();
    currentDoc.title = audio.title;
    let lan = request.lang || "en";
    let speed = request.speed || 5;

    let config = getConf();
    let content = request.content;

    let BDTTS = `https://fanyi.baidu.com/gettts?lan=${lan}&text=${encodeURIComponent(
      content
    )}&spd=${speed}&source=web`;

    let YDTTS =
      "https://dict.youdao.com/dictvoice?audio=" +
      encodeURIComponent(content) +
      "&type=2";
    if (
      request.speeker == "BD" ||
      config.autoSound == "BD" ||
      (config.autoSound == "auto" && lastAutoSound != "YD")
    ) {
      audio.src = BDTTS;
    } else if (
      request.speeker == "YD" ||
      config.autoSound == "YD" ||
      (config.autoSound == "auto" && lastAutoSound == "YD")
    ) {
      if (lan != "en") {
        responseAll();
        return;
      } else audio.src = YDTTS;
    }

    let tryTimes = 1;

    let onEnded = function () {
      tryTimes = 0;

      responseAll();
    };
    let onError = function (ee) {
      console.error(audio.src);
      console.error(ee);
      if (config.autoSound && tryTimes > 0 && tryTimes < 5) {
        lastAutoSound = lastAutoSound == "BD" ? "YD" : "BD";
        tryTimes++;
        try {
          let src = lastAutoSound == "BD" ? BDTTS : YDTTS;
          console.log(src);
          audio.src = src;
        } catch (eee) {
          console.error(eee);
        }
        try {
          audio.play();
        } catch (e1) {
          console.log("error on");
          onEnded();
        }
        return;
      }
      console.log("error on");
      onEnded();
    };
    audio.onerror = onError;

    let timer = setTimeout(() => {
      console.log("timerout");
      if (tryTimes && audio.currentTime == 0) {
        onError();
      }
    }, 3000);
    audio.onloadeddata = function () {
      console.error("cancel timer" + audio.duration);
      if (!isNaN(audio.duration)) {
        tryTimes = 0;
        clearTimeout(timer);
      }
    };

    audio.onended = onEnded;
    console.error(request.wait);
    if (request.wait) {
      try {
        audio.play();
      } catch (e1) {
        console.log("error on");
        onEnded();
      }

      return true;
    } else {
      try {
        audio.play();
      } catch (e1) {
        console.log("error on");
        onEnded();
      }

      return false;
    }
  },

  setConfig: (request, sendResponse) => {
    storejs.set("config", encode(JSON.stringify(request.content)));
    sendResponse(getConf());
  },
  getConfig: (request, sendResponse) => {
    (async () => {
      let config = getConf();

      if (!updateconfig) {
        updateconfig = 1;
        let rconfig = {};

        let rhost = "https://smlog.github.io/data/config.";
        try {
          rconfig = await $.ajax({
            url: rhost + "js",
            dataType: "jsonp",
            jsonpCallback: "applyConfig",
          });
        } catch (ee) {
          console.error(ee);
          try {
            rconfig = await fetch(rhost + "json").then((r) => r.json());
          } catch (error) {
            console.error(error);
            updateconfig = 0;
          }
        }
        config = Object.assign(config, rconfig);
      }

      sendResponse(config);
    })();
  },

  urls: (request, sendResponse) => {
    loadMjUrls(request, sendResponse);
  },
  mUpload: (request, sendResponse) => {
    (async () => {
      let resp = await uploadCache();
      sendResponse(resp);
    })();
  },
};
function getConf() {
  let r = (storejs.get("config") && decode(storejs.get("config"))) || {};
  console.log(r);
  return r;
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

async function canRefresh(type, force, fn) {
  let ct = new Date().getTime();
  let config = getConf();
  if (!config["show" + type]) return;
  let key = "_" + type;

  let v = storejs.get(key) || 0;
  console.log(v);
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
    let req = await fetch(commitsUrl + "&page=" + curPage, {
      method: "get",
      headers: headers,
    });
    if (req.status != 200) {
      throw await req.json();
    }
    let pageCommits = await req.json();
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
/*
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
*/

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
  //let videos = loadUnGZipStore("videos") || [];
  let videos = [];

  try {
    videos = (await loadpkoData("videos")) || [];
    // videos = await fetch("data/videos").then((r) => r.json());
  } catch (eee) {
    console.error(eee);
  }

  let vs = [];
  let exitMap = videos.reduce((map, item) => {
    if (!map[item.vid] && !map[item.title]) {
      map[item.vid] = 1;
      map[item.title] = 1;
      vs.push(item);
    }

    return map;
  }, {});
  videos = vs;
  let config = getConf();

  //let rVideos = await getVideos();
  let plist = await getVideoPromiseList(config);

  for (let p = 0; p < plist.length; p++) {
    try {
      let rVideos = await plist[p]();

      for (let i = 0; i < rVideos.length; i++) {
        let item = rVideos[i];

        if (exitMap[item.vid]) continue;
        if (item.title)
          if (exitMap[item.title.replace(/[^0-9a-z]/gi, "")]) continue;

        exitMap[item.vid] = 1;
        if (item.title) exitMap[item.title.replace(/[^0-9a-z]/gi, "")] = 1;
        videos.unshift(item);
      }
      // videos.sort((a, b) => b.dt - a.dt);
      // sendResp({ contents: videos });
    } catch (eee) {
      console.error(eee);
      // alert(eee);
      bus.$emit("error", eee);
    }
  }

  videos.sort((a, b) => b.dt - a.dt);

  videos.length = Math.min(config.retains || 200, videos.length);

  // gzipAndStore("videos", videos);
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

    let DataRep = storejs.get("user");

    let name = DataRep;
    let rep = "data";

    let httpsRep = "https://" + name + ".github.io/" + rep + "/";
    let path = "update.json";
    let sinceName = request.type + "Since";

    let words = loadUnGZipStore(RWORD) || [];
    let nwords = loadUnGZipStore(NWORD, 1) || [];
    let lastSyncDate = storejs.get(sinceName);

    let ts = +new Date();

    if (DataRep)
      try {
        let updateIndex = await fetch(
          httpsRep + "updateIndex.json?t=" + ts
        ).then((r) => r.json());

        storejs.set("uploadDate", updateIndex.date);

        if (updateIndex.date > lastSyncDate) {
          let updateData = await fetch(
            httpsRep + "updateData.json?t=" + ts
          ).then((r) => r.json());

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
          await uploadCache();

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
    if (DataRep)
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

    if (window.debug) window.debug("gzipAndStore RWORD");
    gzipAndStore(RWORD, words);
    if (window.debug) window.debug("NWORD nwords");

    gzipAndStore(NWORD, nwords, 1);

    let allWords = nwords.concat(words);

    if (lastSyncDate)
      storejs.set(
        sinceName,
        new Date(new Date(lastSyncDate).getTime() + 1000).toISOString()
      );
    if (window.debug)
      window.debug("config.fzWords " + config.fzWords + " " + newList.length);

    if (config.fzWords > 0 && newList.length > config.fzWords) {
      console.log(newList);
      let rnewList = newList.map((e) => {
        let obj = Object.assign({}, e, { i: 1 });
        delete obj["errorUrl"];
        // delete obj["n"];
        return obj;
      });

      if (DataRep)
        if (rnewList.length > 0) {
          let content = JSON.stringify(rnewList);
          console.log(content);
          let json = await updateRepFile(name, rep, path, content);
          console.log(json);
          if (window.debug) window.debug(json);

          ret.error = json.error;

          if (json.commit) {
            lastSyncDate = new Date(
              new Date(json.commit.committer.date).getTime() + 1000
            ).toISOString();
            storejs.set(sinceName, lastSyncDate);

            words.unshift(...rnewList.filter((e) => e.n));
            gzipAndStore(RWORD, words);

            nwords.length = 0;
            if (window.debug) window.debug("save NWORD nwords");

            gzipAndStore(NWORD, nwords, 1);
            allWords = words;
          }
        }
    }

    ret.contents = allWords;
    sendResponse(ret);
  },
  videos: async (reqeust, sendResp) => {
    let videos = await fetchvideos(sendResp);

    sendResp({ contents: videos, done: 1 });
  },
};

window.fetchvideos = fetchvideos;

async function loadMjUrls(request, sendResponse) {
  let DataRep = "smlog";
  if (DataRep)
    await getBlobContent(
      DataRep,
      "data",
      request.content.p,
      0,
      request.content.cache
    )
      //return fetch("https://smlog.github.io/data/mj.json?" + request.content.cache)
      //.then(r=>r.text())
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
  //else sendResponse({ content: 0 });
}
/*
function unGzip(content) {
  return pako.ungzip(content, {
    to: "string",
  });
}*/
function gZip(content) {
  return pako.gzip(content, { to: "string" });
}

function gzipAndStore(key, obj, notzip) {
  localStorage.setItem(
    key,
    notzip ? JSON.stringify(obj) : encode(JSON.stringify(obj))
  );
}
function loadUnGZipStore(key) {
  let raw = localStorage.getItem(key);

  if (raw) {
    return raw[0] == "[" ? jsonparse(raw) : decode(localStorage.getItem(key));
  }
  return [];
}

async function uploadCache() {
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
  let date = new Date(new Date().getTime() + 1000).toISOString();
  if (json.commit)
    json = await updateRepFile(
      name,
      rep,
      "updateIndex.json",
      JSON.stringify({
        date: date,
      })
    );
  if (json.commit) {
    gzipAndStore(RWORD, allWords);

    gzipAndStore(NWORD, nwords, 1);
    console.info("merge ok");
    storejs.set("uploadDate", date);

    return allWords;
  }
  return 0;
}
