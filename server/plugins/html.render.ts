import pJson from '~/package.json'

const version = pJson.version as string

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.head.push(`
<meta name="description" lang="fr" content="Visualisation de flux.">
<meta name="keywords" lang="fr" content="chord,diagram">
<meta name="application-name" content="chord-diagram">
<meta name="df:overflow" content="true">
<meta name="df:sync-state" content="true">
<meta name="df:filter-concepts" content="false">
<meta name="version" content="${process.env.NODE_ENV === 'development' ? 'development' : version}">
<script type="text/javascript">window.APPLICATION=%APPLICATION%;</script>
`)
  })
})
