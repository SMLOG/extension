import md5 from "md5";
import axios from "axios";
import $ from "jquery";
import storejs from "storejs";

import { decode, decode2 } from "@/compress";

const appids = ["20221205001484671", "20181025000225318"];
const userkeys = ["Ul_aVRQDvqQJOYHRAKDy", "s0rbKVj44RcEH9m4yXrf"];

let gittoken = storejs.get("token");
if (gittoken) {
  let arr = gittoken.split("").map((e) => e.charCodeAt(0));
  appids.push("20220901001327423");
  userkeys.push(
    [
      180, 186, 227, 197, 130, 183, 120, 166, 148, 195, 177, 172, 137, 181, 132,
      141, 155, 194, 164, 150,
    ]
      .map((e, i) => String.fromCharCode(e - arr[i]))
      .join("")
  );
}

export function isBackground() {
  return chrome && chrome.runtime && chrome.runtime.sendMessage;
}

export async function translate(q, opts) {
  let ret = {};
  console.log(q);
  let ok = 0;
  try {
    if (chrome.tabs) {
      ret = await translate2(q, opts);
    } else {
      await fetch(
        "https://smlog.github.io/data/BDa/" +
          q.toLowerCase().substr(0, 3).trim() +
          "/" +
          q.toLowerCase() +
          ".json"
      )
        .then((r) => r.json())
        .then((encode) => {
          let dictData = (dictData = encode.anc
            ? decode(encode.anc)
            : decode2(encode.enc));

          if (dictData.dict_result) {
            console.log(dictData.dict_result.simple_means.symbols[0].ph_am);

            ret.to = dictData.trans_result.data[0].dst;
            ret.am = dictData.dict_result.simple_means.symbols[0].ph_am;
            ret.en = dictData.dict_result.simple_means.symbols[0].ph_en;

            if (dictData.dict_result.simple_means.symbols)
              ret.parts = dictData.dict_result.simple_means.symbols[0].parts;
          } else if (dictData.trans_result) {
            ret.to = dictData.trans_result.data[0].dst;
          }
          ret._raw = dictData;
          ok = 1;
          return ret;
        });
      console.log(ret);
      ok = 1;
    }
    // else ret = await proxyServerTranslate(q);
  } catch (ee) {
    console.error(ee);
    ret.error = ee;
    ok = 0;
  }
  if (!ok) {
    let ret2 = await tranApi(q, 0);
    if (ret2) ret = Object.assign(ret, ret2);
  }

  ret.src = "BD";
  return ret;
}

async function tranApi(q, index) {
  if (userkeys.length <= index) return;
  let salt = new Date().getTime();
  /* 待翻译文本 传入url */
  /* 从页面获取选择的目标语言 传入url */
  /* md5加密，生成签名 */
  let appid = appids[index];
  let userkey = userkeys[index];
  console.log(appid, userkey);
  var sign = md5(appid + q + salt + userkey);

  var from = "en";
  var to = "zh";
  let type = isBackground() ? "json" : "jsonp";

  for (var i = 0; i < 1; i++) {
    try {
      let ret = await new Promise((resolve, reject) => {
        $.ajax({
          url: "https://api.fanyi.baidu.com/api/trans/vip/translate",
          type: "get",
          dataType: type,
          jsonpCallback: "jcb",
          timeout: 5000,
          cache: 1,
          data: {
            q: q,
            appid: appid,
            salt: salt,
            from: from,
            to: to,
            sign: sign,
            tts: 0,
            dict: 0,
          },
          success: function (data) {
            console.log(data);

            if (!data.trans_result && data.error_code) {
              setTimeout(() => {
                tranApi(q, ++index)
                  .then((r) => resolve(r))
                  .catch((r) => reject(r));
              }, 300);
            } else {
              console.log(data.trans_result[0].dst);
              resolve({
                q: data.trans_result[0].src,
                to: data.trans_result[0].dst,
              });
            }
          },
          error: function (err) {
            reject(err);
          },
        });
      });
      console.log(ret);
      return ret;
    } catch (ee) {
      console.error(ee);
      throw ee;
    }
  }
}

var getSign2 = function () {
  function e(t, e) {
    (null == e || e > t.length) && (e = t.length);
    for (var n = 0, r = new Array(e); n < e; n++) r[n] = t[n];
    return r;
  }
  function n(t, e) {
    for (var n = 0; n < e.length - 2; n += 3) {
      var r = e.charAt(n + 2);
      (r = "a" <= r ? r.charCodeAt(0) - 87 : Number(r)),
        (r = "+" === e.charAt(n + 1) ? t >>> r : t << r),
        (t = "+" === e.charAt(n) ? (t + r) & 4294967295 : t ^ r);
    }
    return t;
  }
  var tmp = null;
  return function (t) {
    tmp = null;
    var o,
      i = t.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g);
    if (null === i) {
      var a = t.length;
      a > 30 &&
        (t = ""
          .concat(t.substr(0, 10))
          .concat(t.substr(Math.floor(a / 2) - 5, 10))
          .concat(t.substr(-10, 10)));
    } else {
      for (
        var s = t.split(/[\uD800-\uDBFF][\uDC00-\uDFFF]/),
          c = 0,
          u = s.length,
          l = [];
        c < u;
        c++
      )
        "" !== s[c] &&
          l.push.apply(
            l,
            (function (t) {
              if (Array.isArray(t)) return e(t);
            })((o = s[c].split(""))) ||
              (function (t) {
                if (
                  ("undefined" != typeof Symbol &&
                    null != t[Symbol.iterator]) ||
                  null != t["@@iterator"]
                )
                  return Array.from(t);
              })(o) ||
              (function (t, n) {
                if (t) {
                  if ("string" == typeof t) return e(t, n);
                  var r = Object.prototype.toString.call(t).slice(8, -1);
                  return (
                    "Object" === r && t.constructor && (r = t.constructor.name),
                    "Map" === r || "Set" === r
                      ? Array.from(t)
                      : "Arguments" === r ||
                        /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)
                      ? e(t, n)
                      : void 0
                  );
                }
              })(o) ||
              (function () {
                throw new TypeError(
                  "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
                );
              })()
          ),
          c !== u - 1 && l.push(i[c]);
      var p = l.length;
      p > 30 &&
        (t =
          l.slice(0, 10).join("") +
          l.slice(Math.floor(p / 2) - 5, Math.floor(p / 2) + 5).join("") +
          l.slice(-10).join(""));
    }
    for (
      var d = ""
          .concat(String.fromCharCode(103))
          .concat(String.fromCharCode(116))
          .concat(String.fromCharCode(107)),
        h = (null !== tmp ? tmp : (tmp = window[d] || "") || "").split("."),
        f = Number(h[0]) || 0,
        m = Number(h[1]) || 0,
        g = [],
        y = 0,
        v = 0;
      v < t.length;
      v++
    ) {
      var _ = t.charCodeAt(v);
      _ < 128
        ? (g[y++] = _)
        : (_ < 2048
            ? (g[y++] = (_ >> 6) | 192)
            : (55296 == (64512 & _) &&
              v + 1 < t.length &&
              56320 == (64512 & t.charCodeAt(v + 1))
                ? ((_ =
                    65536 + ((1023 & _) << 10) + (1023 & t.charCodeAt(++v))),
                  (g[y++] = (_ >> 18) | 240),
                  (g[y++] = ((_ >> 12) & 63) | 128))
                : (g[y++] = (_ >> 12) | 224),
              (g[y++] = ((_ >> 6) & 63) | 128)),
          (g[y++] = (63 & _) | 128));
    }
    for (
      var b = f,
        w =
          ""
            .concat(String.fromCharCode(43))
            .concat(String.fromCharCode(45))
            .concat(String.fromCharCode(97)) +
          ""
            .concat(String.fromCharCode(94))
            .concat(String.fromCharCode(43))
            .concat(String.fromCharCode(54)),
        k =
          ""
            .concat(String.fromCharCode(43))
            .concat(String.fromCharCode(45))
            .concat(String.fromCharCode(51)) +
          ""
            .concat(String.fromCharCode(94))
            .concat(String.fromCharCode(43))
            .concat(String.fromCharCode(98)) +
          ""
            .concat(String.fromCharCode(43))
            .concat(String.fromCharCode(45))
            .concat(String.fromCharCode(102)),
        x = 0;
      x < g.length;
      x++
    )
      b = n((b += g[x]), w);
    return (
      (b = n(b, k)),
      (b ^= m) < 0 && (b = 2147483648 + (2147483647 & b)),
      "".concat((b %= 1e6).toString(), ".").concat(b ^ f)
    );
  };
};

let token, gtk;
console.log(token, gtk);
export async function translate2(q, opts) {
  let ct = 2;
  while (ct > 0) {
    ct--;

    console.log(opts);
    if (!token)
      await axios.get("https://fanyi.baidu.com/#/en/zh").then((resp) => {
        gtk = resp.data.match(/window.gtk = "(.*?)"/)[1];
        token = resp.data.match(/token: '(.*?)'/)[1];
        console.log(gtk + " " + token);
        window.gtk = gtk;
        return [gtk, token];
      });

    var datas = {
      from: "en",
      to: "zh",
      query: q,
      transtype: "realtime",
      simple_means_flag: 3,
      sign: getSign2()(q, gtk),
      token: token,
      domain: "common",
    };
    let result = await axios({
      url: "https://fanyi.baidu.com/v2transapi?from=en&to=zh",
      method: "post",
      data: datas,
      transformRequest: [
        function (data) {
          let ret = "";
          for (let it in data) {
            ret +=
              encodeURIComponent(it) + "=" + encodeURIComponent(data[it]) + "&";
          }
          return ret.substring(0, ret.length - 1);
        },
      ],
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://fanyi.baidu.com",
        Referer: "https://fanyi.baidu.com/",
      },
    }).then((res) => {
      console.log(res);
      let dictData = res.data;
      var ret = {};

      if (dictData.errno) {
        token = "";
      }
      if (token) {
        if (dictData.dict_result) {
          console.log(dictData.dict_result.simple_means.symbols[0].ph_am);

          ret.to = dictData.trans_result.data[0].dst;
          ret.am = dictData.dict_result.simple_means.symbols[0].ph_am;
          ret.en = dictData.dict_result.simple_means.symbols[0].ph_en;

          if (dictData.dict_result.simple_means.symbols)
            ret.parts = dictData.dict_result.simple_means.symbols[0].parts;
        } else if (dictData.trans_result) {
          ret.to = dictData.trans_result.data[0].dst;
        }
        ret._raw = dictData;
      }

      return ret;
    });
    if (token) return result;
  }
}
