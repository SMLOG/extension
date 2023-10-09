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
let ls = localStorage;

if (ls.run_tran_always == 'true') {
  setTimeout(() => {
    activeApp();
  }, 1000);

}

document.addEventListener("keyup", (event) => {
  console.log(event);
  if (event.key == "Control") {
    if (!document.querySelector("#mytranslate_app")) {
      if (new Date().getTime() - lastTime < 500) {
        activeApp();
      }
    } else if (new Date().getTime() - lastTime < 500) {

      ls.run_tran_always = confirm('make the site always run translate?');


    }
    lastTime = new Date().getTime();

  } else {
    lastTime = 0;
  }

});
