import { Parser } from "m3u8-parser";

export async function getAAduio(item, type) {
  let manifest = await fetch(item.url).then((r) => r.text());
  let parser = new Parser();

  parser.push(manifest);
  parser.end();

  var parsedManifest = parser.manifest;
  console.log(parsedManifest);
  let av = parsedManifest.mediaGroups.AUDIO.audio_aac ? 0 : 1;
  let videoUrl;

  if (type == "A") {
    av = 0;
    videoUrl =
      item.url +
      "/../" +
      parsedManifest.mediaGroups.AUDIO.audio_aac.English.uri;
  } else {
    videoUrl =
      item.url +
      "/../" +
      (av
        ? parsedManifest.playlists.sort(
            (a, b) => a.attributes.BANDWIDTH - b.attributes.BANDWIDTH
          )[0].uri
        : parsedManifest.mediaGroups.AUDIO.audio_aac.English.uri);
  }

  return [videoUrl, av];
}
