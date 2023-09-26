// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  app: {
    cdnURL: process.env.PUBLIC_URL,
    head: {
      title: 'Dashboards'
    }
  },
  modules: [
    // @ts-ignore
    //(_, nuxt) => nuxt.hooks.hook('vite:extendConfig', config => config.plugins.push(vuetify()))
  ],
  //css: ['vuetify/styles'],
  build: {
    transpile: [/@koumoul/, /@data-fair/]
  }
})