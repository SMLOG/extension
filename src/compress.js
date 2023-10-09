const pako = require("pako");
const uint8base64 = require("byte-base64");
const lzma = require("lzma/src/lzma_worker.js").LZMA_WORKER;
export function encode(str) {
    /* let content = btoa(
         pako.gzip(JSON.stringify(ret._raw), { to: "string", level: 9 })
       )*/
    let content = lzma.compress(str, 9)
    content = uint8base64.bytesToBase64(new Uint8Array(content));
    return content;
}

export function decode(str) {
    //JSON.parse(pako.ungzip(str, { to: "string" }))
    return JSON.parse(
        lzma.decompress(uint8base64.base64ToBytes(str)))
        ;
}
export function decode2(str) {
    return JSON.parse(pako.ungzip(str, { to: "string" }))
}
export function decodeStr(str) {
    //JSON.parse(pako.ungzip(str, { to: "string" }))
    return lzma.decompress(uint8base64.base64ToBytes(str));
}