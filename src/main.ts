import { createApp } from 'vue'
// global.scss REPLACES 'vuetify/styles' — never both. It compiles Vuetify with
// $body-font-family: var(--d-body-font-family), a variable set by _theme.css.
import '@data-fair/lib-vuetify/style/global.scss'
import { createVuetify } from 'vuetify'
import { createI18n } from 'vue-i18n'
import { createSession } from '@data-fair/lib-vue/session.js'
import { vuetifySessionOptions } from '@data-fair/lib-vuetify'
import { createUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { createConfig } from './composables/config'
import App from './App.vue'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

// Expose reactiveSearchParams to the v-iframe-compat shim injected by DataFair:
// avoids a full reload when the app is itself embedded in a parent
// d-frame (portal, dashboard). Must be set at module level, BEFORE createApp().
;(window as unknown as { vIframeOptions: object }).vIframeOptions = { reactiveParams: reactiveSearchParams }

async function init () {
  // the _public.js <script> of index.html sets window.__PUBLIC_SITE_INFO, read without
  // fetch; siteInfo triggers refreshSiteInfo (deprecated) and is only a fallback
  const session = await createSession({
    directoryUrl: '/simple-directory',
    siteInfo: !window.__PUBLIC_SITE_INFO
  })

  const percentFormats = {
    percent: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
    percentPrecise: { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }
  } as const
  const i18n = createI18n({
    legacy: false,
    locale: session.lang.value,
    fallbackLocale: 'en',
    numberFormats: { fr: percentFormats, en: percentFormats }
  })

  const vuetify = createVuetify({
    ...vuetifySessionOptions(session),
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } }
  })

  const app = createApp(App)
  app.use(vuetify)
    .use(session)
    .use(i18n)
    .use(createUiNotif())
    .use(createConfig())
  app.mount('#app')
}

init()
