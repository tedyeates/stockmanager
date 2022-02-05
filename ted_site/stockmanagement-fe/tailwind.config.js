module.exports = {
  purge: {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    safelist: [
      'flex-1',
      'md:w-1/2',
      '-ml-8',
      'ml-1',
      'h-3',
      'w-3',
      'h-6',
      'w-6',
      'h-9',
      'w-9',
      'rotate-45',
      '-rotate-45',
      'origin-top-left',
      'origin-top-right',
      'origin-bottom-left',
      'origin-bottom-right',

      'lg:px-16',
      'px-6',
      'fixed',
      'z-50',
      'transition-all',
      'duration-200',
      'navbar',
      'lg:hidden',
      'hidden',
      'fill-current',
      'w-auto',
      'items-center',
      'lg:items-center',
      'lg:w-auto'
    ]
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    triangles: { // defaults to {}
      'left': {
        direction: 'left',      // one of 'left', 'right', 'up', 'down', 'left-up', 'left-down', 'right-up', and 'right-down'
        size: '1em',            // defaults to defaultSize
        height: '0.5em',        // defaults to half the size; has no effect on the diagonal directions (e.g. 'left-up')
        color: 'currentColor',  // defaults to defaultColor
      },
    },
    extend: {},
  },
  variants: {
    triangles: ['responsive'], // defaults to []
    extend: {
      backgroundColor: ['active'],
    },
  },
  plugins: [
    require('tailwindcss-triangles')({
      componentPrefix: 'c-',        // defaults to 'c-'
      defaultSize: '1em',           // defaults to '1em'
      defaultColor: 'currentColor', // defaults to 'currentColor'
    }),
  ],
}
