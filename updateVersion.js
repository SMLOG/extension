var fs = require("fs");

console.log("read src/version.js");
var data = fs.readFileSync("src/version.js", "utf8");
var num = data.replace(/[^0-9]/g, "");
var next = parseInt(num) + 1;
var con = data.replace(/\d+/, next);
fs.writeFileSync("src/version.js", con);

console.log(
  "success update src/version.js version num from ",
  num,
  " to ",
  next
);
