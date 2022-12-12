import { Parser } from "m3u8-parser";
import { service } from "@/service";

export async function getAAduio(item, type) {
  let manifest = await fetch(item.url).then((r) => r.text());
  let parser = new Parser();

  parser.push(manifest);
  parser.end();

  var parsedManifest = parser.manifest;
  console.log(parsedManifest);
  let audio = parsedManifest.mediaGroups.AUDIO;
  audio = JSON.stringify(audio).replace(/[{}]/g, "").trim();
  let av = audio ? 0 : 1;
  let videoUrl;

  if (type == "A") {
    av = 0;
    videoUrl = item.url + "/../" + audio.match(/uri":\s*"(.*?)"/)[1];
  } else {
    videoUrl =
      item.url +
      "/../" +
      (av
        ? parsedManifest.playlists.sort(
            (a, b) => a.attributes.BANDWIDTH - b.attributes.BANDWIDTH
          )[0].uri
        : audio.match(/uri":\s*"(.*?)"/)[1]);
  }

  return [videoUrl, av];
}

export async function playSound(item, wait, lan = "en") {
  let content = lan == "en" ? item.q : cn(item);

  return tts(lan, content, wait);
}
function cn(item) {
  let str = item.to
    .split(";")
    .map((e) => {
      let t = e.indexOf(".");
      return t > 0 && t < 5 ? e.substring(t + 1) : e;
    })
    .join(" ");
  return str;
}
async function tts(lan, content, wait, speed) {
  return new Promise((resolve) => {
    service(
      null,
      {
        cmd: "audio",
        content: content,
        wait: wait,
        lang: lan,
        speed: speed,
      },
      function (response) {
        if (response) resolve();
      }
    );
  });
}

export async function bgsound() {
  return tts("en", "", 0, 0);
}
export async function fetchRequest(url, params = {}, timeout = 10000) {
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
}
