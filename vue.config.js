const TerserPlugin = require("terser-webpack-plugin");

class TimestampPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("TimestampPlugin", (compilation) => {
      compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(
        "TimestampPlugin",
        (data, cb) => {
          let timestamp = new Date().getTime();
          data.head = data.head.map((item) => {
            if (item.tagName === "link") {
              item.attributes.href = item.attributes.href.replace(
                item.attributes.href,
                `${item.attributes.href}?${timestamp}`
              );
            }
            return item;
          });

          data.body = data.body.map((item) => {
            if (item.tagName === "script") {
              item.attributes.src = item.attributes.src.replace(
                item.attributes.src,
                `${item.attributes.src}?${timestamp}`
              );
            }
            return item;
          });
          cb(null, data);
        }
      );
    });
  }
}

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
      // include: [/^index.html$/, /^js\/.*/],
      exclude: [/games/, /_locales/],
      precacheManifestFilename: "precache-manifest.js?_v=[manifestHash]",
      //dontCacheBustURLsMatching: 1,
      navigateFallback: "index.html",
      // importWorkboxFrom: "local",
      // exclude: [/\.(?:png|jpg|jpeg|svg)$/], //在预缓存中排除图片
      importScripts: ["wb-debug.js"],

      runtimeCaching: [
        {
          urlPattern: /.*?.html/,
          handler: "staleWhileRevalidate",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "index",
            cacheableResponse: { statuses: [200] },
            // networkTimeoutSeconds: 10,
          },
        },
        {
          urlPattern: /.*?.json.*?/,
          handler: "networkFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "index",
            cacheableResponse: { statuses: [200] },
            networkTimeoutSeconds: 5,
          },
        },
        /*{
          urlPattern: /.*?workbox.*?\.js$/,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "cache",
            cacheableResponse: { statuses: [200] },
          },
        },*/

        {
          urlPattern: /.*?\.(png|gif|jpg)/i,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "img",
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?manifest.format=m3u8.aapl.*?/i,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "m3u8-aapl",
            expiration: {
              maxAgeSeconds: 86400 * 5,
              maxEntries: 200,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?cnn.clip.*?m3u8.*?/i,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "cnn-clip",
            expiration: {
              maxAgeSeconds: 86400 * 5,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?fave.api.cnn.io.*?/i,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "cnn.io",
            expiration: {
              maxAgeSeconds: 86400 * 5,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?medium.ngtv.io.*?/i,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "ngtv.io",
            expiration: {
              maxAgeSeconds: 86400 * 5,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?cbsnews.*?.m3u8/i,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "cbsnews",
            expiration: {
              maxAgeSeconds: 86400 * 5,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?\.(vtt|db_xml)/,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "cache",
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          urlPattern: /.*?Fragments.aac_.*?/i,
          handler: "cacheFirst",
          method: "GET",

          options: {
            //networkTimeoutSeconds: 20,
            expiration: {
              maxAgeSeconds: 86400 * 10,
            },
            cacheName: "aac-msn",
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?cbsnews.*?aac/i,
          handler: "cacheFirst",
          method: "GET",

          options: {
            //networkTimeoutSeconds: 20,
            expiration: {
              maxAgeSeconds: 86400 * 10,
            },
            cacheName: "aac-cbsnews",
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?dictvoice.*?/i,
          handler: "cacheFirst",
          method: "GET",

          options: {
            //networkTimeoutSeconds: 20,
            expiration: {
              maxAgeSeconds: 86400 * 100,
            },
            cacheName: "dictvoice",
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?gettts.*?/i,
          handler: "cacheFirst",
          method: "GET",

          options: {
            //networkTimeoutSeconds: 20,
            expiration: {
              maxAgeSeconds: 86400 * 100,
            },
            cacheName: "gettts",
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  },
};
