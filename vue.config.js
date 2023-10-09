const TerserPlugin = require("terser-webpack-plugin");




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
    },
  },
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === "production") {
      config.output
        .filename("js/[name].js?_hash=[contenthash:8]")
        .chunkFilename("js/[name].js?_hash=[contenthash:8]");

      config.plugin("extract-css").tap((args) => {
        args[0].filename = "css/[name].css?_hash=[contenthash:8]";
        args[0].chunkFilename = "css/[name].css?_hash=[contenthash:8]";
        return args;
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("disabled pwa for non-production");
      config.plugins.delete("pwa");
      config.plugins.delete("workbox");
    }
    config.plugin("define").tap((args) => {
      console.log(args[0]);
      args[0]["process.env"].version = [new Date()]
        .map((e) =>
          [
            e.getFullYear(),
            e.getMonth() + 1,
            e.getDate(),
            e.getHours(),
            e.getMinutes(),
          ].join("")
        )
        .join("");
      return args;
    });
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
    },
  },
  publicPath: "",
  productionSourceMap: false,
  filenameHashing: false,
  css: {
    // 是否使用css分离插件 ExtractTextPlugin
    extract: true,
    // 开启 CSS source maps?
    sourceMap: false,
    // css预设器配置项
    loaderOptions: {},
    // 启用 CSS modules for all css / pre-processor files.
    modules: false,
  },
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

      "/cnn": {
        target: "https://edition.cnn.com",
        changeOrigin: true,
        pathRewrite: {
          "^/cnn": "/",
        },
      },
    },
  },
  configureWebpack: {
    plugins: [
      // new TimestampPlugin(), // 自定义的webpack插件*
    ],
    optimization: {
      minimize: process.env.NODE_ENV === "production",
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ["console.log"],
            },
            extractComments: false,
          },
        }),
      ],
    },
  },
  pwa: {
    manifestOptions: {
      name: process.env.VUE_APP_APP_NAME,
      short_name: process.env.VUE_APP_SHORT_NAME,
      start_url: process.env.VUE_APP_START_URL,
      display: "standalone",
    },
    workboxPluginMode: "GenerateSW",
    workboxOptions: {
      // debug: true,
      skipWaiting: true,
      clientsClaim: true,
      include: [/^[a-zA-Z]*.html$/, /^js\/.*?\.js/, /^css\/.*?\.css/, /^favicon.ico/],
      // exclude: [/games/, /_locales/, /.*?background.js/, /sw.js/],
      exclude: [/js\/background.js/, /js\/content-script.js/, /js\/popup.js/, /popup.html/],
      precacheManifestFilename: "precache-manifest.js?_v=[manifestHash]",
      //dontCacheBustURLsMatching: 1,

      navigateFallback: "index.html",
      //importWorkboxFrom: "local",
      // exclude: [/\.(?:png|jpg|jpeg|svg)$/], //在预缓存中排除图片
      importScripts: ["wb-debug.js"],

      runtimeCaching: [

      ],
    },
  },
};
