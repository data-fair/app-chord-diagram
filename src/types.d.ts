/// <reference types="vite/client" />

import type { Application, Dataset, Field } from '@data-fair/lib-common-types/application/index.js'
import type { FullSiteInfo } from '@data-fair/lib-vue/session.js'
import type { ChordDiagramConfig } from './config/index.js'

declare global {
  interface Window {
    APPLICATION: Application & { href: string }
    // expose reactiveSearchParams au shim v-iframe-compat injecté par DataFair
    vIframeOptions?: { reactiveParams: Record<string, string> }
    // posé par _public.js, lu par la session à la place du fetch déprécié
    __PUBLIC_SITE_INFO?: FullSiteInfo
    // exposée par puppeteer dans le service de capture : résout vers un booléen (mode gif)
    triggerCapture?: (animationSupported?: boolean) => Promise<boolean>
    animateCaptureFrame?: () => boolean | undefined
  }
}

export type { Application, Dataset, Field }
export type AnyConfig = ChordDiagramConfig
