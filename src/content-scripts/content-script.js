console.log("Hello from the content-script");

let activeApp = () => {
  var root = document.createElement("div");
  var id = "mytranslate_app";
  root.setAttribute("id", id);
  root.setAttribute("class", "mytranslate-extension");

  document.body.appendChild(root);
  require("@/main");
};

let lastTime = 0;

document.addEventListener("keydown", (event) => {
  console.log(event);

  if (event.key == "Control" && !document.querySelector("#mytranslate_app")) {
    if (new Date().getTime() - lastTime < 1000) {
      activeApp();
    }
    lastTime = new Date().getTime();
  }
});
