import { fetchRequest } from "@/lib";
const x2js = require("x2js");
const x2jsIns = new x2js();

export const config = {
  crossOrigs: async function (usingCross, url, type) {
    let en = encodeURIComponent;
    //https://json2jsonp.com/
    return await fetchRequest(
      usingCross ? "https://api.allorigins.win/raw?url=" + en(url) : url,
      {
        method: "get",

        headers: {},
      }
    )
      .then((response) => {
        return type == "json" ? response.json() : response.text();
      })
      .then((r) => (type == "xml" ? x2jsIns.xml2js(r) : r));
  },
};

export async function crossOrigs(url, type) {
  return config.crossOrigs(1, url, type);
}
export async function getVideos() {
  let t = parseInt(new Date().getTime() / 7200000);
  let srcs = Object.keys(config.mods.videos.m);
  let rVideos = [];
  for (let i = 0; i < srcs.length; i++) {
    let src = srcs[i];
    console.error(src);
    if (!config.mods.videos.m[src].enable) continue;
    let item = config.mods.videos.m[src];
    let res = item.res;
    for (let j = 0; j < res.length; j++) {
      let item = res[j];
      for (let k = 0; k < item.urls.length; k++) {
        try {
          let url = item.urls[k];
          let resp = await config.crossOrigs(
            item.crossOrig,
            url + "?t=" + t,
            item.type
          );
          rVideos.push(...(await item.conv(resp, src)));
          console.error(rVideos);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
  let ret = [];
  rVideos.reduce((map, item) => {
    if (!map[item.vid]) {
      map[item.vid] = 1;
      ret.push(item);
    }
    return map;
  }, {});
  return ret;
}

export async function getSourceMediaList(sourceUrl) {
  let resp;
  try{
   resp = await config.crossOrigs(0, sourceUrl, "json");
  }catch(error){
  resp = await config.crossOrigs(1, sourceUrl, "json");
  }
  return resp;
}
export async function getVideoPromiseList() {}
export function getAndPrepareNextExtra() {}
