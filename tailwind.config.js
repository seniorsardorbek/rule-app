/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand palette — single source of truth. Named semantically so intent
        // stays readable when the raw hex changes.
        primary: {
          DEFAULT: "#0088FF",
          50: "#E6F3FF",
          100: "#CCE7FF",
          500: "#0088FF",
          600: "#006FD1",
          700: "#0056A3",
        },
        info: {
          DEFAULT: "#00C0E8",
          50: "#E6F9FD",
          500: "#00C0E8",
          600: "#009BBA",
        },
        success: {
          DEFAULT: "#34C759",
          50: "#E8F9EC",
          500: "#34C759",
          600: "#28A745",
        },
        warning: {
          DEFAULT: "#FFCC00",
          50: "#FFF9E6",
          500: "#FFCC00",
          600: "#D1A600",
        },
        danger: {
          DEFAULT: "#F56F72",
          50: "#FEECED",
          500: "#F56F72",
          600: "#E84146",
        },
        ink: {
          DEFAULT: "#100910",
          muted: "#BEBEBE",
        },
        surface: {
          DEFAULT: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};
