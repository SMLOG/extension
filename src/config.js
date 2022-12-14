const pako = require("pako");
const x2js = require("x2js");
const x2jsIns = new x2js();
function decode(str) {
  return JSON.parse(
    pako.ungzip(atob(str), {
      to: "string",
    })
  );
}

export async function getCnnExtra(item) {
  if (item.url) return;
  var mediaBaseUrl = "https://medium.ngtv.io/media/";
  var VideoIOBaseUrl = "https://fave.api.cnn.io";
  var url =
    VideoIOBaseUrl +
    "/v1/video?id=" +
    item.vid +
    "&customer=cnn&edition=international&env=prod";

  let resp = await fetch(url).then((resp) => resp.json());
  var mediumId = resp.mediumId;

  var m3u8 =
    mediaBaseUrl +
    mediumId +
    "?appId=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6ImNubi1jbm4td2ViLTk1am96MCIsIm5ldHdvcmsiOiJjbm4iLCJwbGF0Zm9ybSI6IndlYiIsInByb2R1Y3QiOiJjbm4iLCJpYXQiOjE1MjQ2ODQwMzB9.Uw8riFJwARLjeE35ffMwSa-37RNxCcQUEp2pqwG9TvM";
  let r = await fetch(m3u8).then((r) => r.json());

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
    return await fetch(
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
    videos: {
      m: {
        cnn: {
          enable: 1,
          ext: getCnnExtra,
          res: [
            {
              type: "xml",
              urls: decode(
                "H4sIAAAAAAAAA6WQsQrDMAxE/yVzsArd8iulg2sJbCpbIZLT5O+ToUvGoOGGg7vHca8hm806ARAWK9JCaqekwlqQBDBahGd4/O2na2mkCgtxNEINW+VhvAfJFNmyCzELn6nk22GUfCt+sjC6CJSkSd1djO57oX+v9fcBtZyYihMCAAA="
              ) /*
          btoa(pako.gzip( JSON.stringify([
            "https://edition.cnn.com/video/data/3.0/video/business/relateds.xml",
            "https://edition.cnn.com/video/data/3.0/video/health/relateds.xml",
            "https://edition.cnn.com/video/data/3.0/video/politics/relateds.xml",
            "https://edition.cnn.com/video/data/3.0/video/tech/relateds.xml",
            "https://edition.cnn.com/video/data/3.0/video/world/relateds.xml",
            "https://edition.cnn.com/video/data/3.0/video/economy/relateds.xml",
            "https://edition.cnn.com/video/data/3.0/video/us/relateds.xml",
            "https://edition.cnn.com/video/data/3.0/video/uk/relateds.xml",
          ]),{to:'string'})) ;
  */,
              conv: async function (json, src) {
                let list = [];
                for (let i = 0; i < json.videos.video.length; i++) {
                  let e = json.videos.video[i];
                  let item = { vid: e.id, title: e.headline, src: src };
                  list.push(dtd(item));
                }
                return list;
              },
            },
            {
              type: "json",
              urls: decode(
                "H4sIAAAAAAAAA4tWyigpKSi20tdPTcksyczP00vOA+L8XP2CnMTKnMziEv2S/ALdvNTyYt2yzJTU/GL9zLyU1Aq9rOL8PKVYAHICSjU/AAAA"
              ),
              /** btoa(pako.gzip( JSON.stringify([
            "https://edition.cnn.com/playlist/top-news-videos/index.json"
          ]),{to:'string'})) ; */
              conv: async function (items, src) {
                let list = [];
                for (let i = 0; i < items.length; i++) {
                  let e = items[i];
                  let item = { vid: e.videoId, title: e.title, src: src };
                  list.push(dtd(item));
                }
                return list;
              },
            },
          ],
        },
        cbs: {
          enable: 0,
          res: [
            {
              type: "json",
              crossOrig: 1,
              /** btoa(pako.gzip( JSON.stringify([
            "https://www.cbsnews.com/video/xhr/collection/component/top-stories-for-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/cbs-village-vod-latest-ott-video-door/",
            "https://www.cbsnews.com/video/xhr/collection/component/full-episodes-auto-vod/",
            "https://www.cbsnews.com/video/xhr/collection/component/coronavirus-vod-ott-schedule/",
            "https://www.cbsnews.com/video/xhr/collection/component/cbs-reports-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/cbs-weekend-news-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/show-the-uplift-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/60-minutes-overtime-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/cbs-this-morning-branded/",
            "https://www.cbsnews.com/video/xhr/collection/component/evening-news-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/60-minutes-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/red-and-blue-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/ott-cbs-saturday-morning/",
            "https://www.cbsnews.com/video/xhr/collection/component/48-hours-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/sunday-morning-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/face-the-nation-ott/",
            "https://www.cbsnews.com/video/xhr/collection/component/the-takeout-ott/",
          ]),{to:'string'})) ; */
              urls: decode(
                "H4sIAAAAAAAAA62TwU4EIQyG32XPdvFgjPFVjAcGOgtZhpK2gL69w0STPcvcSEo//v9v+bgE1SLvxvTer26RjF2ujjbTokcyX4GNo5TQaaS8H7dCGbMapQKixBEFVmIgVXN5+i9tvwotpmRvCI08JKsoOqBwdIIn4gn+WlMCLFHI73ptVRrPzAgmpmxb5CqH4KFUXEBfE07mwFiIVU5ItCPeMXsYPZM4CdRBA0ItKa46SXt9hi3mus8YqCFr3PAEuxqiwEacY77BwjZ7nBkxNjxIJ6T36HcKxOhh9wVLqrOJjY0dqYnVyt5+/yU3gXx5g0CVp3et5gc9k7DVOjwWN9tRmaQNkNo7Uv39Ap8/+hmTQkEFAAA="
              ).filter((e) =>
                [2, 3, 4, 5].includes(new Date().getDay())
                  ? e.indexOf("weekend") == -1
                  : 1
              ),
              conv: function (resp, src) {
                return resp.items
                  .filter((e) => e.type == "vod" && e.video2)
                  .map((e) => {
                    return dtd({
                      vid: e.id,
                      url: e.video2,
                      title: e.fulltitle,
                      cc: e.captions,
                      src: src,
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
              /** btoa(pako.gzip( JSON.stringify([
              "https://assets.msn.com/service/MSN/Feed/me?$top=20&DisableTypeSerialization=true&activityId=7E2F0C44-D701-4998-A932-A31D48A50A60&apikey=0QfOX3Vn51YCzitbLaRkTTBadtWpgTN8NZLW0C1SEM&contentType=video&location=21.3744|110.248&market=en-us&query=news%20video&queryType=myfeed&responseSchema=cardview&timeOut=1000&wrapodata=false"
          ]),{to:'string'})) ; */
              urls: decode(
                "H4sIAAAAAAAAAyWP206DQBRF/6XReQNmgFpqMjHYS2LSSyrEeokPp3BqJ4UZnDnQ0Pjxavu6k7322h+DA1Hj7oMAnENyfu20X5g6cGg7VWCwzFbBHLEMany4IdPIkLOpcrCrMO8bzNAqqNQZSBktybbIoCDVKeqfSjmahXM+iWNvOuLCi8fjxEvHUeilkZjGSTrk6R1n0Kgj9pJv9uvX6EUPxdvkrGi3gOdjnj9CSdvmK18lq/fFlk9ENluywmhCTf/7slMlGlaZ4moQCj8axfGPENwP44TVYI9IErXXOvbdou2lxpO7Dfm1eIkuoLrf/91kFl1jtMOsOGANsgBbdgpPjFSN65ak4Jyzk4XGlEAg91A5HHz+ApDd/ttHAQAA"
              ),
              conv: function (resp, src) {
                return resp.subCards
                  .filter(
                    (e) => e.type == "video" && e.provider.name != "BuzzVideos"
                  )
                  .map((e) => {
                    let closedCaptions = e.videoMetadata.closedCaptions;

                    let r = dtd({
                      vid: e.id,
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
                    r.d = [new Date(r.dt)]
                      .map(
                        (e) =>
                          `${e.getFullYear()}/${
                            e.getMonth() + 1
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

export async function getVideoPromiseList() {
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
      let item = res[j];
      for (let k = 0; k < item.urls.length; k++) {
        try {
          pList.push(async () => {
            let url = item.urls[k];
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
