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
          handler: "networkFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "index",
            cacheableResponse: { statuses: [200] },
            networkTimeoutSeconds: 5,
          },
        },
        {
          urlPattern: /.*?.json/,
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
          urlPattern: /.*?(\/video|\/media).*/,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "vcache",
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?\.mp[34]/,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "vcache",
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
          urlPattern: /.*?\.(ts|aac)/,
          handler: "cacheFirst",
          method: "GET",

          options: {
            //networkTimeoutSeconds: 20,
            expiration: {
              maxAgeSeconds: 86400 * 15,
            },
            cacheName: "vcache",
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?baidu.*/,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "cache",
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /.*?\?cache=\d+$/,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "cache",
            cacheableResponse: { statuses: [0, 200] },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 14, // 2 Week
              //  maxEntries: 100,
            },
          },
        },
        {
          urlPattern: /.*?(\?t=|%3Ft%3D)\d+$/,
          handler: "cacheFirst",
          method: "GET",
          options: {
            //networkTimeoutSeconds: 20,
            cacheName: "cache",
            cacheableResponse: { statuses: [0, 200, 502] },
            expiration: {
              maxAgeSeconds: 60 * 60 * 1000, // 2 Week
              // maxEntries: 100,
            },
          },
        },
      ],
    },
  },
};
