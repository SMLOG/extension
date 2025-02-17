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
let run_tran_always =(ls.getItem('run_tran_always')||'false')=='true';

if (run_tran_always ) {
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

      run_tran_always =  confirm(run_tran_always?'cancel the site always run translate?':'make the site always run translate?') && !run_tran_always;
      ls.setItem('run_tran_always',run_tran_always);

    }
    lastTime = new Date().getTime();

  } else {
    lastTime = 0;
  }

});
