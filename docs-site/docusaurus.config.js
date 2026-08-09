// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Pixel Divers Docs',
  tagline: 'Documentation for Pixel Divers modders and contributors',
  favicon: 'https://pixeldivers.world/assets/diver.png',

  url: 'https://pixeldivers.world',
  baseUrl: '/docs/',

  // Static site on GitHub Pages; broken links would ship broken.
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // docs ARE the site; /docs/ lands on the intro
          sidebarPath: './sidebars.js',
        },
        blog: false,
        pages: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'Pixel Divers Docs',
        logo: {
          alt: 'Pixel Divers',
          src: 'https://pixeldivers.world/assets/diver.png',
          className: 'navbar-pixel-logo',
        },
        items: [
          {
            href: 'https://pixeldivers.world',
            label: 'pixeldivers.world',
            position: 'right',
          },
          {
            href: 'https://discord.gg/aAdwxTzrkf',
            label: 'Discord',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [],
        copyright: `© ${new Date().getFullYear()} KashTheKing · Pixel Explorers LLC`,
      },
      prism: {
        additionalLanguages: ['gdscript'],
      },
    }),
};

export default config;
