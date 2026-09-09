/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        discord: {
          darkest: 'var(--igloochat-darkest, #1e1f22)',   // server bar
          darker: 'var(--igloochat-darker, #2b2d31)',     // channel sidebar
          dark: 'var(--igloochat-dark, #313338)',         // chat area
          darkhover: 'var(--igloochat-darkhover, #35373c)', // message hover
          floating: 'var(--igloochat-floating, #232428)', // user panel & popups
          input: 'var(--igloochat-input, #383a40)',      // text input
          blurple: 'var(--igloochat-blurple, #5865F2)',  // main brand
          'blurple-hover': 'var(--igloochat-blurple-hover, #4752c4)',
          'blurple-active': 'var(--igloochat-blurple-active, #3c45a5)',
          green: '#23a55a',     // online & voice ring
          amber: '#f0b232',     // idle
          red: '#f23f43',       // dnd & live & disconnect
          gray: '#80848e',      // offline
          muted: 'var(--igloochat-muted, #949ba4)',      // channel names / secondary text
          normal: 'var(--igloochat-normal, #dbdee1)',    // chat text
          header: 'var(--igloochat-header, #f2f3f5)',    // channel headers & titles
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
