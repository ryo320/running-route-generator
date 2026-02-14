import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // サイトマップの設定を追加
    Sitemap({
      hostname: 'https://running-runroute.vercel.app', // あなたのVercelのURLに変更してください
      dynamicRoutes: ['/'], // 現時点ではトップページのみでOK
    }),
  ],
  // Vercelで公開する場合は base: '/' にすることをお忘れなく！
  base: '/',
})