import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '')
  const loginUrl = new URL(environment.VITE_LOGIN_API_URL)
  const reconciliationUrl = new URL('https://dttipkowrzwemqpnksuf.supabase.co/functions/v1/reconciliation')
  const contentVerificationUrl = new URL('https://dttipkowrzwemqpnksuf.supabase.co/functions/v1/content_verification')
  const orderVerificationUrl = new URL('https://dttipkowrzwemqpnksuf.supabase.co/functions/v1/content_verification_order')
  const addOrderUrl = new URL('https://dttipkowrzwemqpnksuf.supabase.co/functions/v1/add_order')
  const addPotatoUrl = new URL('https://dttipkowrzwemqpnksuf.supabase.co/functions/v1/add_potato')
  const addCupUrl = new URL('https://dttipkowrzwemqpnksuf.supabase.co/functions/v1/add_cup')
  const summarizeUrl = new URL('https://dttipkowrzwemqpnksuf.supabase.co/functions/v1/summarize')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/login': {
          target: loginUrl.origin,
          changeOrigin: true,
          rewrite: () => `${loginUrl.pathname}${loginUrl.search}`,
          // Make an upstream Supabase cookie a cookie for localhost, so the
          // browser stores it and sends it to every same-origin API route.
          cookieDomainRewrite: '',
          cookiePathRewrite: '/',
        },
        '/api/reconciliation': {
          target: reconciliationUrl.origin,
          changeOrigin: true,
          rewrite: () => `${reconciliationUrl.pathname}${reconciliationUrl.search}`,
          cookieDomainRewrite: '',
        },
        '/api/content-verification-order': {
          target: orderVerificationUrl.origin,
          changeOrigin: true,
          rewrite: () => `${orderVerificationUrl.pathname}${orderVerificationUrl.search}`,
          cookieDomainRewrite: '',
        },
        '/api/content-verification': {
          target: contentVerificationUrl.origin,
          changeOrigin: true,
          rewrite: () => `${contentVerificationUrl.pathname}${contentVerificationUrl.search}`,
          cookieDomainRewrite: '',
        },
        '/api/add-order': {
          target: addOrderUrl.origin,
          changeOrigin: true,
          rewrite: () => `${addOrderUrl.pathname}${addOrderUrl.search}`,
          cookieDomainRewrite: '',
        },
        '/api/add-potato': {
          target: addPotatoUrl.origin,
          changeOrigin: true,
          rewrite: () => `${addPotatoUrl.pathname}${addPotatoUrl.search}`,
          cookieDomainRewrite: '',
        },
        '/api/add-cup': {
          target: addCupUrl.origin,
          changeOrigin: true,
          rewrite: () => `${addCupUrl.pathname}${addCupUrl.search}`,
          cookieDomainRewrite: '',
        },
        '/api/summarize': {
          target: summarizeUrl.origin,
          changeOrigin: true,
          rewrite: () => `${summarizeUrl.pathname}${summarizeUrl.search}`,
          cookieDomainRewrite: '',
        },
      },
    },
  }
})
