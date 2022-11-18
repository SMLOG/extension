import { Parser } from "m3u8-parser";

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
