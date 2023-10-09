import bus from "@/bus";
import { fetchRequest } from "@/lib";
const x2js = require("x2js");
const x2jsIns = new x2js();


export async function getCnnExtra(item) {
  if (item.url) return;
  var mediaBaseUrl = "https://medium.ngtv.io/media/";
  var VideoIOBaseUrl = "https://fave.api.cnn.io";
  var url =
    VideoIOBaseUrl +
    "/v1/video?id=" +
    item.vid +
    "&customer=cnn&edition=international&env=prod";

  let resp = await fetchRequest(url).then((resp) => resp.json());
  var mediumId = resp.mediumId;

  var m3u8 =
    mediaBaseUrl +
    mediumId +
    "?appId=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6ImNubi1jbm4td2ViLTk1am96MCIsIm5ldHdvcmsiOiJjbm4iLCJwbGF0Zm9ybSI6IndlYiIsInByb2R1Y3QiOiJjbm4iLCJpYXQiOjE1MjQ2ODQwMzB9.Uw8riFJwARLjeE35ffMwSa-37RNxCcQUEp2pqwG9TvM";
  let r = await fetchRequest(m3u8).then((r) => r.json());

  let deviceType = "";
  let agent = navigator.userAgent;
  deviceType = /ipad|tablet/i.test(agent)
    ? "tablet"
    : /mobile/i.test(agent)
      ? "phone"
      : "desktop";

  if (resp.closedCaptions && resp.closedCaptions.types) {
    item.cc = resp.closedCaptions.types.filter(
      (e) => e.format == "webvtt" && e.track && e.track.url
    )[0].track.url;
  }

  item.url = r.media[deviceType].unprotected.secureUrl;

  bus.$emit("video", item);
}

const dtd = function (item) {
  let m = (item.url || item.vid).match(/\d{4}\/\d{2}\/\d{2}/);
  let d = m && m.length > 0 && m[0];
  let dt = new Date(d).getTime();
  item.d = d;
  item.dt = dt;
  item.i = 0;
  return item;
};
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
  mods: {
    news: {},
    videos: {
      m: {
        cnn: {
          enable: 1,
          ext: getCnnExtra,
          res: [
            {
              type: "xml",

              conv: async function (json, src) {
                let list = [];
                for (let i = 0; i < json.videos.video.length; i++) {
                  let e = json.videos.video[i];
                  let item = { vid: e.id, title: e.headline, src: src,
                    duration:e.duration.split(":").map((a,b)=>parseInt(a)*(b==0?1:(b==1?60:3600))).reduce((t,i)=>t+i,0)
                };
                  list.push(dtd(item));
                }
                return list;
              },
            },
            {
              type: "json",

              conv: async function (items, src) {
                let list = [];
                let t = new Date().getTime();
                for (let i = 0; i < items.length; i++) {
                  let e = items[i];
                  let item = { vid: e.videoId, title: e.title, src: src, t: t };
                  list.push(dtd(item));
                }
                return list;
              },
            },
          ],
        },
        cbs: {
          enable: 1,
          res: [
            {
              type: "json",
              crossOrig: 1,

              conv: function (resp, src) {
                let t = new Date().getTime();
                return resp.items
                  .filter((e) => e.type == "vod" && e.video2)
                  .map((e) => {
                    return dtd({
                      vid: e.id,
                      url: e.video2,
                      title: e.fulltitle,
                      cc: e.captions,
                      src: src,
                      t: t,
                      duration:e.duration
                    });
                  });
              },
            },
          ],
        },
        msn: {
          enable: 1,
          res: [
            {
              type: "json",
              crossOrig: 0,

              conv: function (resp, src) {
                let t = new Date().getTime();
                return resp.subCards
                  .filter(
                    (e) => e.type == "video" && e.provider.name != "BuzzVideos"
                  )
                  .map((e) => {
                    let closedCaptions = e.videoMetadata.closedCaptions;
                    let r = dtd({
                      vid: e.id,
                      duration:e.videoMetadata.playTime,
                      url: e.externalVideoFiles.sort((a) =>
                        a.url.indexOf("m3u8-aapl") > -1 ? -1 : 0
                      )[0].url,
                      title: e.title,
                      cc:
                        closedCaptions &&
                        closedCaptions.length &&
                        closedCaptions[0].href,
                      src: src,
                      org: e.provider && e.provider.name,
                    });
                    r.dt = new Date(e.publishedDateTime).getTime();
                    r.t = t;
                    r.d = [new Date(r.dt)]
                      .map(
                        (e) =>
                          `${e.getFullYear()}/${e.getMonth() + 1
                          }/${e.getDate()}`
                      )
                      .join("");
                    return r;
                  });
              },
            },
          ],
        },
      },
    },
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

export async function getVideoPromiseList(conf) {
  let t = parseInt(new Date().getTime() / 7200000);
  let srcs = Object.keys(config.mods.videos.m);
  let pList = [];
  for (let i = 0; i < srcs.length; i++) {
    let src = srcs[i];
    console.error(src);
    if (!config.mods.videos.m[src].enable) continue;
    let item = config.mods.videos.m[src];
    let res = item.res;
    for (let j = 0; j < res.length; j++) {

      let urls = conf.urls[src].filter(e => e.enable);
      for (let k = 0; k < urls.length; k++) {
        let item = res[urls[k].index ? urls[k].index : 0];
        try {
          pList.push(async () => {
            let url = urls[k].url;
            console.log(url);
            let resp = await config.crossOrigs(
              item.crossOrig,
              url + "?t=" + t,
              item.type
            );
            return await item.conv(resp, src);
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  return pList;
}

export async function getAndPrepareNextExtra(item, mediaType, nextItem) {
  console.error(nextItem);
  if (item.loaded) return item;
  return await getExtra(item, mediaType);
}

export async function getExtra(item, mediaType) {
  if (!item) return;
  if (mediaType == 1) {
    return await getCnnExtra(item, mediaType);
  } else if (config.mods.videos.m[item.src]) {
    let ext = config.mods.videos.m[item.src].ext;
    return ext && (await ext(item));
  }
}

export const sources = Object.keys(config.mods.videos.m);
