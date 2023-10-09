module.exports = {
  pages: {
    popup: {
      template: "public/browser-extension.html",
      entry: "./src/popup/main.js",
      title: "Popup",
    },
    index: {
      template: "public/index.html",
      entry: "./src/main.js",
      title: "Main",
      chunks: ["index"],
    },
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: "src/background.js",
        },
        contentScripts: {
          entries: {
            "content-script": ["src/content-scripts/content-script.js"],
          },
        },
      },
      extensionReloaderOptions: {
        port: 9091,
      },
    },
  },
  publicPath: "http://192.168.0.102:8082/",
  devServer: {
    port: 8082,
    proxy: {
      "/t": {
        target: "http://localhost:8081",
        changeOrigin: true,
        pathRewrite: {
          "^/t": "/t",
        },
      },
    },
  },
};
