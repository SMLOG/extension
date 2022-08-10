console.log("Hello from the content-script");

if (
  !document.querySelector(".mytranslate-extension") &&
  (document.documentElement.lang == "en" ||
    document.title.match(/^[\x00-\x7F]+$/)) // eslint-disable-line
) {
  var root = document.createElement("div");
  var id = "mytranslate_app";
  root.setAttribute("id", id);
  root.setAttribute("class", "mytranslate-extension");

  document.body.appendChild(root);

  require("@/main");
}
