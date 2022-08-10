//import storejs from "storejs";
//import { translate } from "./translator";
import { callService } from "./service";

// const translate = require("@asmagin/google-translate-api");

chrome.runtime.onInstalled.addListener(installScript);
console.log(installScript);
function installScript(details) {
  console.log(details);
  // console.log('Installing content script in all tabs.');
  let params = {
    currentWindow: true,
  };
  chrome.tabs.query(params, function gotTabs(tabs) {
    let contentjsFile = chrome.runtime.getManifest().content_scripts[0].js[0];
    for (let index = 0; index < tabs.length; index++) {
      chrome.tabs.executeScript(
        tabs[index].id,
        {
          file: contentjsFile,
        },
        (result) => {
          console.log(result);
          const lastErr = chrome.runtime.lastError;
          if (lastErr) {
            //console.error("tab: " + tabs[index].id + " lastError: ");
            console.log(lastErr);
          }
        }
      );
      chrome.tabs.insertCSS(
        tabs[index].id,
        {
          file: "css/index.css",
        },
        (result) => {
          console.log(result);
          const lastErr = chrome.runtime.lastError;
          if (lastErr) {
            // console.error("tab: " + tabs[index].id + " lastError: ");
            console.log(lastErr);
          }
        }
      );
    }
  });
}

//监听消息
chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  callService(sender, request, sendResponse);

  return true;
});
