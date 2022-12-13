console.log("Hello from the content-script");

let activeApp = () => {
  var root = document.createElement("div");
  var id = "mytranslate_app";
  root.setAttribute("id", id);
  root.setAttribute("class", "mytranslate-extension");

  document.body.appendChild(root);
  require("@/main");
};

if (
  !document.querySelector(".mytranslate-extension") &&
  document.documentElement.lang == "en" /*||
    document.title.match(/^[\x00-\x7F]+$/)*/ // eslint-disable-line
) {
  activeApp();
} else {
  document.addEventListener("keydown", (event) => {
    console.log(event);

    if (event.key == "Control" && !document.querySelector("#mytranslate_app")) {
      activeApp();
    }
  });
}
