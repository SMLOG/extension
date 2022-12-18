async function sleep(t) {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}
const TTS_Providers = {
  YD: function (request) {
    let lan = request.lang || "en";
    let content = request.content;
    if (lan == "zh")
      return ` https://tts.youdao.com/fanyivoice?word=${encodeURIComponent(
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
export async function playAudio(autoSound, sendResp, request, audio) {
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
    } else tts = [autoSound];

    for (let i = 0; i < tts.length; i++) {
      let curProvide = tts[i];
      let src = TTS_Providers[curProvide](request);
      if (!src) continue;

      console.error(src);
      audio.pause();
      let ret = await Promise.race(
        [
          new Promise((resolve) => {
            audio.onerror = () => {
              resolve(3000);
            };
            let endPromise = new Promise((r) => {
              audio.onended = () => {
                lastOKTTS[lan] = curProvide;
                r(0);
              };
            });

            audio.onloadeddata = function () {
              if (isNaN(audio.duration)) {
                resolve(3000);
              } else resolve(endPromise);
            };
            audio.src = src;
            console.error("asrc", src);
            audio.play();
          }),
        ],
        sleep(3000)
      );
      if (ret != 3000) {
        console.error(audio.duration);
        let wret = await Promise.race([
          ret,
          sleep((audio.duration + 1) * 1000),
        ]);
        audio.onloadeddata = audio.onerror = audio.onended = undefined;
        if (!wret) {
          break;
        }
      }
    }
    audio.onloadeddata = audio.onerror = audio.onended = undefined;
  } catch (eee) {
    console.error(eee);
  }
  sendResp({});
}
