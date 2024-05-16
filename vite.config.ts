import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
    plugins: [
        nodePolyfills()
    ],
    build: {
        minify: true,
        sourcemap: true,
        lib: {
            formats: ['es', 'umd'],
            entry: './src/index.js',
            name: 'SolanaWalletConnect',
            fileName: (format: string) => `index.${format}.js`
        }
    }
})
