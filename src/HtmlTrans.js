export function htmlTrans(dict, str) {
  return htmlTrans2(dict, str)[0];
}
export function htmlTrans2(dict, str) {
  //let str = q + " ";
  var dictMap = dict.reduce((map, cur) => {
    map[cur.q] = cur;
    return map;
  }, {});

  var keys = dict
    .reduce((prev, cur) => {
      prev.push(cur.q.toLowerCase());
      return prev;
    }, [])
    .sort();

  var inKey = (string) => {
    let ls = string.toLowerCase();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] == ls) return true;
    }
    return false;
  };

  let curWords = [];
  let template = (q, to) => {
    curWords.push(dictMap[to]);
    return `<em class="newWord"><i class="newWorda">${q}</i><u class="newWordb">${
      dictMap[to].to
    } <b class="newWordc">${
      dictMap[to].am ? "[" + dictMap[to].am + "]" : ""
    }</b></u></em>`;
  };
  var startKey = (string) => {
    let ls = string.toLowerCase();

    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(ls) == 0) return true;
    }
    return false;
  };

  var sp = [];
  let s;
  for (var i = 0, j = 0; i < str.length; ) {
    var c = str[i];
    switch (c) {
      case " ":
        if (j < i) {
          s = str.substring(j, i);
          sp.push(s);
          j = i;
        }

        while (str[++i] == " ");
        s = str.substring(j, i);
        sp.push(s);
        j = i;

        break;
      case "<":
        if (j < i) {
          s = str.substring(j, i);
          sp.push(s);
          j = i;
        }

        while (str[++i] != ">");
        s = str.substring(j, ++i);
        sp.push(s);
        j = i;
        break;
      default:
        if (!((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "-")) {
          if (j < i) {
            s = str.substring(j, i);
            sp.push(s);
            j = i;
          }

          sp.push(c);
          j = ++i;
        } else i++;
    }
  }

  if (j <= str.length - 1) {
    s = str.substring(j, str.length);
    sp.push(s);
  }
  var sps = sp;
  var cons = [];
  for (let i = 0; i < sps.length; ) {
    let j, k;
    let sub;
    for (j = i + 1, k = i; j <= sps.length; ) {
      sub = sps
        .slice(i, j)
        .filter((e) => e.indexOf("<") == -1)
        .join("");
      if (startKey(sub)) {
        if (inKey(sub)) {
          k = j;
        }
        ++j;

        continue;
      } else break;
    }
    if (k > i) {
      //get it
      sub = sps
        .slice(i, k)
        .filter((e) => e.indexOf("<") == -1)
        .join("")
        .toLowerCase();
      // cons.push("{{");
      let html = sps.slice(i, k).join("");
      let hsp = html.split(">");
      if (hsp.length % 2 == 0) {
        if (hsp[0].indexOf("<") > -1) {
          let temp = hsp.shift();
          let c = hsp.join(">");

          cons.push(`${temp}>${template(c, sub)}`);
        } else {
          let temp = hsp.pop();
          temp = hsp.pop();
          let c = hsp.join(">");
          cons.push(`${template(c, sub)}${temp}>`);
        }
      } else {
        if (dictMap[sub] == undefined) {
          console.log(sub);
        }
        cons.push(`${template(html, sub)}`);
      }
      //cons.push(html + dictMap[sub].to);

      // cons.push("}}");

      i = k;
    } else {
      cons.push(sps.slice(i, i + 1).join(""));
      i++;
    }
  }

  // console.log(cons.join("\n"));
  return [cons.join(""), curWords];
}
/**
 * var str =
  "After shooting up 76% in 2020, Amazon's stock is up just 6% this year, compared to a nearly 26% rise in the S&amp;P 500. Supply chain problems and pay hikes to recruit and retain workers have eaten into Amazon's profits despite the ongoing boom in online shopping.";

var dict = [
  { q: "ongoing", to: "不间断的" },
  { q: "boom", to: "繁荣" },
  { q: "morning", to: "早上" },
  { q: "good morning", to: "早上好" },
];
 */
//htmlTrans(dict, str);
