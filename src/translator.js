import md5 from "md5";
import axios from "axios";
import $ from "jquery";
import storejs from "storejs";

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
/*
const ports = { "http:": 8081, "https:": 8443 };
const SERVICE_BASE =
  location.protocol + "//192.168.0.102:" + ports[location.protocol] + "/t";
let fail = 0;

async function proxyServerTranslate(from) {
  //baidu
  let ret = {};
  ret.src = "BD";
  ret.from = from;
  let url = `${SERVICE_BASE}/t`;
  if (fail) throw "error connect proxy.";

  try {
    let resp = await new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        type: "get",
        dataType: "json",
        timeout: 5000,
        data: {
          q: from,
        },
        success: function (data) {
          resolve(data);
        },
        error: function (err) {
          reject(err);
        },
      });
    });
    console.log(resp);
    var dictData = resp.result;
    ret.to = ret.text = dictData.trans_result.data[0].dst;
    console.log(ret.to, dictData.trans_result.data[0].dst);
    if (dictData.dict_result) {
      ret.am = dictData.dict_result.simple_means.symbols[0].am;
      if (dictData.dict_result.simple_means.symbols[0].en != ret.am)
        ret.en = dictData.dict_result.simple_means.symbols[0].en;
    }

    var logs = resp.logs;
    if (logs && logs.length > 0 && logs[0].n) {
      ret.n = true;
    }
  } catch (ee) {
    console.error(ee);
    ret.error = (ee && ee.statusText) || ee;

    fail = 1;
    // ret.error += err.message;
    ret.errorUrl = url;
    console.error(ret.errorUrl);
  }

  return ret;
}*/
export async function translate(q, opts) {
  let ret = {};
  console.log(q);
  let ok = 0;
  try {
    if (chrome.tabs) {
      ret = await translate2(q, opts);
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
          timeout: 5000,
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

function aa(gtk) {
  "use strict";
  console.log(gtk);
  function a(r) {
    if (Array.isArray(r)) {
      for (var o = 0, t = Array(r.length); o < r.length; o++) t[o] = r[o];
      return t;
    }
    return Array.from(r);
  }
  function n(r, o) {
    for (var t = 0; t < o.length - 2; t += 3) {
      var a = o.charAt(t + 2);
      (a = a >= "a" ? a.charCodeAt(0) - 87 : Number(a)),
        (a = "+" === o.charAt(t + 1) ? r >>> a : r << a),
        (r = "+" === o.charAt(t) ? (r + a) & 4294967295 : r ^ a);
    }
    return r;
  }
  function e(r) {
    var o = r.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g);
    if (null === o) {
      var t = r.length;
      t > 30 &&
        (r =
          "" +
          r.substr(0, 10) +
          r.substr(Math.floor(t / 2) - 5, 10) +
          r.substr(-10, 10));
    } else {
      for (
        var e = r.split(/[\uD800-\uDBFF][\uDC00-\uDFFF]/),
          C = 0,
          h = e.length,
          f = [];
        h > C;
        C++
      )
        "" !== e[C] && f.push.apply(f, a(e[C].split(""))),
          C !== h - 1 && f.push(o[C]);
      var g = f.length;
      g > 30 &&
        (r =
          f.slice(0, 10).join("") +
          f.slice(Math.floor(g / 2) - 5, Math.floor(g / 2) + 5).join("") +
          f.slice(-10).join(""));
    }
    var u = void 0,
      l =
        "" +
        String.fromCharCode(103) +
        String.fromCharCode(116) +
        String.fromCharCode(107);
    u = null !== i ? i : (i = window[l] || "") || "";
    for (
      var d = u.split("."),
        m = Number(d[0]) || 0,
        s = Number(d[1]) || 0,
        S = [],
        c = 0,
        v = 0;
      v < r.length;
      v++
    ) {
      var A = r.charCodeAt(v);
      128 > A
        ? (S[c++] = A)
        : (2048 > A
            ? (S[c++] = (A >> 6) | 192)
            : (55296 === (64512 & A) &&
              v + 1 < r.length &&
              56320 === (64512 & r.charCodeAt(v + 1))
                ? ((A =
                    65536 + ((1023 & A) << 10) + (1023 & r.charCodeAt(++v))),
                  (S[c++] = (A >> 18) | 240),
                  (S[c++] = ((A >> 12) & 63) | 128))
                : (S[c++] = (A >> 12) | 224),
              (S[c++] = ((A >> 6) & 63) | 128)),
          (S[c++] = (63 & A) | 128));
    }
    for (
      var p = m,
        F =
          "" +
          String.fromCharCode(43) +
          String.fromCharCode(45) +
          String.fromCharCode(97) +
          ("" +
            String.fromCharCode(94) +
            String.fromCharCode(43) +
            String.fromCharCode(54)),
        D =
          "" +
          String.fromCharCode(43) +
          String.fromCharCode(45) +
          String.fromCharCode(51) +
          ("" +
            String.fromCharCode(94) +
            String.fromCharCode(43) +
            String.fromCharCode(98)) +
          ("" +
            String.fromCharCode(43) +
            String.fromCharCode(45) +
            String.fromCharCode(102)),
        b = 0;
      b < S.length;
      b++
    )
      (p += S[b]), (p = n(p, F));
    return (
      (p = n(p, D)),
      (p ^= s),
      0 > p && (p = (2147483647 & p) + 2147483648),
      (p %= 1e6),
      p.toString() + "." + (p ^ m)
    );
  }
  var i = null;
  return e;
}

var getSign = aa();

let token, gtk;
console.log(token, gtk);
export async function translate2(q, opts) {
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
    sign: getSign(q, gtk),
    token: token,
    domain: "common",
  };
  return await axios({
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

    if (dictData.dict_result) {
      console.log(dictData.dict_result.simple_means.symbols[0].am);

      ret.to = dictData.trans_result.data[0].dst;
      ret.am = dictData.dict_result.simple_means.symbols[0].am;
      if (dictData.dict_result.simple_means.symbols[0].en != ret.am)
        ret.en = dictData.dict_result.simple_means.symbols[0].en;

      if (dictData.dict_result.simple_means.symbols)
        ret.parts = dictData.dict_result.simple_means.symbols[0].parts;
    } else if (dictData.trans_result) {
      ret.to = dictData.trans_result.data[0].dst;
    }

    return ret;
  });
}
