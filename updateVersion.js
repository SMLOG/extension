var fs = require("fs");

console.log("read src/version.js");
var data = fs.readFileSync("src/version.js", "utf8");
var match = data.match("v(\\d\\d)(\\d\\d)(\\d\\d)\\.(\\d+)");
var yy = (new Date().getFullYear() + "").substr(-2);
var mm = ("0" + (new Date().getMonth() + 1)).substr(-2);
var dd = ("0" + new Date().getDate()).substr(-2);
var no = 1;
console.log(data);
if (match && yy + mm + dd == match[1] + match[2] + match[3]) {
  no = parseInt(match[4]) + 1;
}
var next = `v${yy}${mm}${dd}.${no}`;
var con = data.replace(match[0], next);

fs.writeFileSync("src/version.js", con);
console.log(
  "success update src/version.js version num from ",
  match[0],
  " to ",
  next
);
