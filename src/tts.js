export const SILENT =
  "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

async function sleep(t) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(t);
    }, t);
  });
}

const TTS_Providers = {
  YD: function (request) {
    let lan = request.lang || "en";
    let content = request.content;
    if (lan == "zh")
      return `https://tts.youdao.com/fanyivoice?word=${encodeURIComponent(
        content
      )}&le=cn&keyfrom=speaker-target`;

    if (lan == "en")
      return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(
        content
      )}&type=2`;
  },
  BD: function (request) {
    let lan = request.lang || "en";
    let speed = request.speed || 5;
    let content = request.content;

    return `https://fanyi.baidu.com/gettts?lan=${lan}&text=${encodeURIComponent(
      content
    )}&spd=${speed}&source=web`;
  },
  BK: function (request) {
    // let lan = request.lang || "en";
    let content = request.content;
    // if (lan != "zh") return;

    return `https://tts.baidu.com/text2audio?cuid=baike&lan=ZH&ctp=1&pdt=301&vol=9&rate=32&per=0&tex=${encodeURI(
      content
    )}`;
  },
  SG: function (request) {
    let content = request.content;

    return `https://fanyi.sogou.com/reventondc/synthesis?text=${encodeURIComponent(
      content
    )}&speed=1&lang=zh-CHS&from=translateweb&speaker=1`;
  },
};

let ALL_TTS = Object.keys(TTS_Providers);
let lastOKTTS = {};

let onendlisteners = [];
let onloadeddatas = [];
let onerrors = [];
let hasinit = 0;
function initAudio(audio) {
  if (!hasinit) {
    window.maudio = audio;
    audio.addEventListener("canplaythrough", () => {
      audio.play();
    });
    audio.addEventListener("ended", () => {
      while (onendlisteners.length) {
        onendlisteners.pop()();
      }
    });
    audio.addEventListener("loadeddata", () => {
      while (onloadeddatas.length) {
        onloadeddatas.pop()();
      }
    });

    audio.addEventListener("error", () => {
      while (onerrors.length) {
        onerrors.pop()();
      }
    });
  }

  hasinit = 1;
}

//let bgAudio = new Audio();
export async function toogleBg(b) {
  let bgAudio = document.querySelector("#bgAudio");
  bgAudio.loop = 1;
  bgAudio.src = SILENT;
  console.error(b);
  if (b) bgAudio.play();
  else bgAudio.pause();
}
export async function playAudio(autoSound, sendResp, request, audio) {
  initAudio(audio);
  try {
    if (!autoSound) sendResp();
    let tts;
    let lan = request.lang || "en";

    if (autoSound == "auto") {
      tts = ALL_TTS.slice();
      if (lastOKTTS[lan]) {
        let index = tts.indexOf(lastOKTTS[lan]);
        if (index != 0) {
          tts.splice(index, 1);
          tts.unshift(lastOKTTS[lan]);
        }
      }
    } else if (autoSound) tts = [autoSound];
    else tts = [];

    for (let i = 0; i < tts.length; i++) {
      let curProvide = tts[i];
      let src = TTS_Providers[curProvide](request);
      if (!src) continue;
      console.log(audio.paused, audio.currentTime, audio.duration);
      while (
        audio.paused &&
        audio.currentTime > 0 &&
        audio.currentTime < audio.duration
      ) {
        await sleep(1000);
        console.log(audio.paused, audio.currentTime, audio.duration);
      }

      // audio.loop = 0;
      // audio.pause();
      let waitend;
      let ret = await Promise.race([
        new Promise((resolve) => {
          onerrors.push(() => {
            console.error("onerror");
            resolve(3000);
          });
          waitend = new Promise((r) => {
            onendlisteners.push(() => {
              lastOKTTS[lan] = curProvide;
              r(0);
            });
          });

          onloadeddatas.push(function () {
            if (isNaN(audio.duration)) {
              resolve(3000);
            } else {
              resolve(0);
            }
          });

          audio.src = src + "&_tts=1";

          let isBlock = 1;
          setTimeout(() => {
            if (isBlock) {
              audio.title = "...error";
              console.error("block error");
              resolve(3000);
            }
          }, 1000);
          audio.load();
          // audio.play();
          isBlock = 0;
        }),
        sleep(3000),
      ]);
      if (ret != 3000) {
        let wret = await Promise.race([
          waitend,
          sleep((audio.duration + 1) * 1000),
        ]);
        //audio.onloadeddata = audio.onerror = audio.onended = undefined;

        if (!wret) {
          break;
        }
      }
    }
  } catch (eee) {
    console.error(eee);
  }
  // audio.onloadeddata = audio.onerror = audio.onended = undefined;

  // audio.loop = 1;
  console.error("loop");
  audio.src = SILENT;
  audio.load();
  //audio.play();
  console.error("sendresponse");
  await sleep(100);
  sendResp({});
}

let aaa = new Audio();
aaa.muted = 1;
aaa.rel = "noreferrer";
aaa.src = SILENT;

document.addEventListener("click", function () {
  if (!aaa.inited) {
    aaa.play();
    aaa.inited = 1;
  }
});
export async function cacheWordTts(en, zh) {
  console.log(zh, en);
  let list = Object.keys(TTS_Providers).map((e) => [
    TTS_Providers[e]({
      content: en,
      lan: "en",
    }),
    TTS_Providers[e]({
      content: zh,
      lan: "zh",
    }),
  ]);

  for (let i = 0; i < list.length; i++) {
    for (let j = 0; j < list[i].length; j++) {
      await fetch(list[i][j] + "&_tts=1", { mode: "no-cors" })
        .catch(() => {
          console.error(list[i][j]);
        })
        .then(() => console.log(list[i][j]));
      0 &&
        (await new Promise((resolve, reject) => {
          let a = aaa;
          let url = list[i][j];
          a.muted = 1;
          a.preload = "auto";

          a.onended = function () {
            console.log("ended");
            resolve(url);
          };
          a.src = url + "&_tts=1";
          a.play();
          a.onerror = function () {
            reject(url);
          };
        }).catch((err) => {
          console.error(err);
        }));
    }
  }
}

window.test = cacheWordTts;
