import { createApp } from 'vue'
// global.scss REMPLACE 'vuetify/styles' — jamais les deux. Il compile Vuetify avec
// $body-font-family: var(--d-body-font-family), variable posée par _theme.css.
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

// Expose reactiveSearchParams au shim v-iframe-compat injecté par DataFair :
// évite le rechargement complet quand l'app est elle-même embedded dans un
// d-frame parent (portail, dashboard). À poser au niveau module, AVANT createApp().
;(window as unknown as { vIframeOptions: object }).vIframeOptions = { reactiveParams: reactiveSearchParams }

async function init () {
  // le <script> _public.js d'index.html pose window.__PUBLIC_SITE_INFO, lu sans
  // fetch ; siteInfo déclenche refreshSiteInfo (déprécié) et ne reste qu'en repli
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
