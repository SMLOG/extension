import { Parser } from "m3u8-parser";
import { service } from "@/service";
import { decode, decodeStr } from "@/compress";

export async function cacheAudio(url) {
  let lines = await fetch(url)
    .then((r) => r.text())
    .then((r) => r.split(/\n/g));

  for (let i = 0; i < lines.length; i++) {
    console.error(lines[i]);
    if (lines[i].substring(0, "#EXTINF:".length) == "#EXTINF:") {
      i++;
      let base = url.substring(0, url.lastIndexOf("/"));
      let u = base + "/" + lines[i];
      console.error(u);

      await fetch(u);
    }
  }
}
export async function getAAduio(item) {
  if (item.audio !== undefined) return item;
  let manifest = await fetch(item.url + "?_=1").then((r) => r.text());
  let parser = new Parser();

  parser.push(manifest);
  parser.end();

  var parsedManifest = parser.manifest;
  console.log(parsedManifest);
  let audio = parsedManifest.mediaGroups.AUDIO;
  audio = JSON.stringify(audio).replace(/[{}]/g, "").trim();

  let match = audio.match(/uri":\s*"(.*?)"/);
  if (match && match.length > 1) item.audio = item.url + "/../" + match[1];
  else item.audio = 0;

  return item;
}

export async function playSound(item, wait, lan = "en") {
  if (!item) return;
  let cnText = cn(item);
  let content = lan == "en" ? item.q : cnText;
  let display = `${item.q}${item.am ? " [" + item.am + "]" : ""} ${cnText}`;

  return tts(lan, content, wait, display);
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
async function tts(lan, content, wait, display) {
  return new Promise((resolve) => {
    service(
      null,
      {
        cmd: "audio",
        content: content,
        wait: wait,
        lang: lan,
        title: display,
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


export async function loadpkoData(modname) {

  try {
    let data = localStorage[modname] || sessionStorage[modname];
    if (data) {

      let ret = data;
      try {
        ret = decode(data);

      } catch (ee) {
        ret = decodeStr(data);
      }
      console.error(ret)
      return ret;
    }
  } catch (le) {
    console.log(le)
  }



  return null;
}
