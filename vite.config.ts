import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
    plugins: [
        react(),
        wasm()
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            'bip39': resolve(__dirname, 'node_modules/bip39/index.js'),
            '@bip39': resolve(__dirname, 'node_modules/bip39/index.js'),
        },
    },
    build: {
        target: 'esnext',
        sourcemap: true,
        commonjsOptions: {
            include: [/bip39/],
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    'wasm-crypto': ['@polkadot/wasm-crypto'],
                    'wallet-wasm': ['@polkadot/wallet-wasm'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['bip39'],
        exclude: ['@polkadot/wasm-crypto', '@polkadot/wallet-wasm'],
    },
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
}) 