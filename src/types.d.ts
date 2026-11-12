/// <reference types="vite/client" />

import type { Application, Dataset, Field } from '@data-fair/lib-common-types/application/index.js'
import type { FullSiteInfo } from '@data-fair/lib-vue/session.js'
import type { ChordDiagramConfig } from './config/index.js'

declare global {
  interface Window {
    APPLICATION: Application & { href: string }
    // exposes reactiveSearchParams to the v-iframe-compat shim injected by DataFair
    vIframeOptions?: { reactiveParams: Record<string, string> }
    // set by _public.js, read by the session instead of the deprecated fetch
    __PUBLIC_SITE_INFO?: FullSiteInfo
    // exposed by puppeteer in the capture service: resolves to a boolean (gif mode)
    triggerCapture?: (animationSupported?: boolean) => Promise<boolean>
    animateCaptureFrame?: () => boolean | undefined
  }
}

export type { Application, Dataset, Field }
export type AnyConfig = ChordDiagramConfig
