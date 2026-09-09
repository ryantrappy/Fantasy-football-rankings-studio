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
            subtle: { value: '#f3f5fb' },
            muted: { value: '#eef2ff' },
            emphasized: { value: '#dce3fc' },
            panel: { value: '#ffffff' },
          },
          fg: {
            DEFAULT: { value: '#17223b' },
            muted: { value: '#526078' },
            subtle: { value: '#526078' },
            error: { value: '#8f2929' },
          },
          border: {
            DEFAULT: { value: '#71809a' },
            emphasized: { value: '#526078' },
            error: { value: '#8f2929' },
          },
          // Define complete palettes: inherited default hues are not guaranteed
          // to contrast with this app's fixed cream/white surfaces.
          indigo: {
            solid: { value: '#3949ab' },
            contrast: { value: '#ffffff' },
            fg: { value: '#3949ab' },
            subtle: { value: '#eef2ff' },
            muted: { value: '#dce3fc' },
            emphasized: { value: '#526078' },
            focusRing: { value: '#a64b12' },
          },
          gray: {
            solid: { value: '#17223b' },
            contrast: { value: '#ffffff' },
            fg: { value: '#17223b' },
            subtle: { value: '#f3f5fb' },
            muted: { value: '#eef2ff' },
            emphasized: { value: '#71809a' },
            focusRing: { value: '#a64b12' },
          },
        },
      },
    },
  }),
);
