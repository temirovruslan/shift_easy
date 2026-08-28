// Colours live in colors.json so this file and src/theme.ts cannot drift.
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: require('./colors.json'),
    },
  },
  plugins: [],
};
