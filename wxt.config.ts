import { defineConfig } from "wxt"
import react from "@vitejs/plugin-react"
import topLevelAwait from "vite-plugin-top-level-await"
import path from 'path'
import { resolve } from 'path'

const chromeMV3Permissions = [
  "storage",
  "sidePanel",
  "activeTab",
  "scripting",
  "declarativeNetRequest",
  "action",
  "unlimitedStorage",
  "contextMenus",
  "tts",
  "notifications"
]

const firefoxMV2Permissions = [
  "storage",
  "activeTab",
  "scripting",
  "unlimitedStorage",
  "contextMenus",
  "webRequest",
  "webRequestBlocking",
  "notifications",
  "http://*/*",
  "https://*/*",
  "file://*/*"
]

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    plugins: [
      react(),
      topLevelAwait({
        promiseExportName: "__tla",
        promiseImportName: (i) => `__tla_${i}`
      }) as any
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'bip39': path.resolve(__dirname, 'node_modules/bip39'),
        'wallet-wasm': path.resolve(__dirname, 'src/Wasm-Blockchain/wallet-wasm/pkg')
      }
    },
    build: {
      rollupOptions: {
        external: ["langchain", "@langchain/community"],
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'wallet_wasm.js' || assetInfo.name === 'wallet_wasm_bg.wasm') {
              return '[name]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      },
      target: ['esnext'],
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      brotliSize: false,
      sourcemap: false,
      copyPublicDir: true,
      outDir: 'build/chrome-mv3'
    },
    optimizeDeps: {
      include: ['bip39'],
      esbuildOptions: {
        target: 'esnext',
        supported: {
          bigint: true
        },
      },
    },
  }),
  entrypointsDir:
    process.env.TARGET === "firefox" ? "entries-firefox" : "entries",
  srcDir: "src",
  outDir: "build",

  manifest: {
    version: "1.0.9",
    name:
      process.env.TARGET === "firefox"
        ? "Aurora - A Web UI for Local AI Models"
        : "__MSG_extName__",
    description: "__MSG_extDescription__",
    default_locale: "en",
    action: {},
    author: { email: "arksong2018@gmail.com" },
    browser_specific_settings:
      process.env.TARGET === "firefox"
        ? {
          gecko: {
            id: "aurora@arkSong"
          }
        }
        : undefined,
    host_permissions:
      process.env.TARGET !== "firefox"
        ? ["http://*/*", "https://*/*", "file://*/*"]
        : undefined,
    commands: {
      _execute_action: {
        description: "Open the Web UI",
        suggested_key: {
          "default": "Ctrl+1",
          "mac": "MacCtrl+1"
        }
      },
      execute_side_panel: {
        description: "Open the side panel",
        suggested_key: {
          default: "Ctrl+Shift+2",
          mac: "MacCtrl+Shift+2"
        }
      }
    },
    content_security_policy:
      process.env.TARGET !== "firefox" ?
        {
          extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; worker-src 'self';"
        } :
        {
          extension_pages: "script-src 'self' 'wasm-unsafe-eval' blob:; object-src 'self'; worker-src 'self' blob:;"
        },
    permissions:
      process.env.TARGET === "firefox"
        ? firefoxMV2Permissions
        : chromeMV3Permissions,
    web_accessible_resources: [
      {
        resources: ["wasm/*", "assets/*", "wallet_wasm.js", "wallet_wasm_bg.wasm"],
        matches: ["<all_urls>"]
      }
    ]
  }
}) as any