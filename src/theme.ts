import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// Keep the document's existing typography and the PNG's browser defaults intact.
// Chakra's reset and default global styles would otherwise affect the export table.
const { globalCss: _globalCss, ...componentConfig } = defaultConfig;
export const system = createSystem(
  componentConfig,
  defineConfig({
    preflight: false,
    // Reset only form controls. No selector here reaches the download markup.
    globalCss: {
      'button, input, select, textarea': {
        font: 'inherit',
        color: 'inherit',
        margin: 0,
        padding: 0,
        border: '0 solid',
        background: 'transparent',
      },
      'button, select': { textTransform: 'none' },
      button: { cursor: 'pointer' },
      'button:disabled': { cursor: 'default' },
    },
    theme: {
      tokens: {
        fonts: {
          body: { value: 'system-ui, sans-serif' },
          heading: { value: 'system-ui, sans-serif' },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            DEFAULT: { value: '#ffffff' },
            subtle: { value: '#f5f3ec' },
            muted: { value: '#edf4ed' },
            emphasized: { value: '#d7e5d9' },
            panel: { value: '#ffffff' },
          },
          fg: {
            DEFAULT: { value: '#20352d' },
            muted: { value: '#58675d' },
            subtle: { value: '#58675d' },
            error: { value: '#8f2929' },
          },
          border: {
            DEFAULT: { value: '#6b776f' },
            emphasized: { value: '#58675d' },
            error: { value: '#8f2929' },
          },
          // Define complete palettes: inherited default hues are not guaranteed
          // to contrast with this app's fixed cream/white surfaces.
          green: {
            solid: { value: '#244e3e' },
            contrast: { value: '#ffffff' },
            fg: { value: '#244e3e' },
            subtle: { value: '#edf4ed' },
            muted: { value: '#d7e5d9' },
            emphasized: { value: '#58675d' },
            focusRing: { value: '#805400' },
          },
          gray: {
            solid: { value: '#20352d' },
            contrast: { value: '#ffffff' },
            fg: { value: '#20352d' },
            subtle: { value: '#f5f3ec' },
            muted: { value: '#edf4ed' },
            emphasized: { value: '#6b776f' },
            focusRing: { value: '#805400' },
          },
        },
      },
    },
  }),
);
