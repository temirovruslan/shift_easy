module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        bg2: "#12121a",
        bg3: "#1a1a24",
        line: "#2a2a35",
        text: "#f0f0f5",
        text2: "#c0c0d0",
        text3: "#55556a",
        blue: "#0a84ff",
        green: "#30d158",
        red: "#ff453a",
        amber: "#ffd60a",
        purple: "#a78bfa",
      },
    },
  },
  plugins: [],
};
