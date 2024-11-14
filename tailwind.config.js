/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/**/*.{html,js,ejs}"],
  theme: {
    container: {
      center: true
    },
    extend: {
      fontFamily: {
        "vazirDigits": ["Vazir-Digits", "sans-serif"]
      },
      colors: {
        "primary": "#007BFF",
        "secondaryButton": "#F8F9FA",
        "disabledButton": "#D6D8DB",
        "primaryBackground": "#F8F9FA",
        "FFFFFF": "#FFFFFF",
        "202020": "#202020",
        "404040": "#404040",
        "606060": "#606060",
        "868686": "#868686",
        "EDEDED": "#EDEDED",
        "CBCBCB": "#CBCBCB",
        "ADADAD": "#ADADAD",
        "DFDFDF": "#DFDFDF",
        "error": "#C30000",
        "error-light-1": "#FFF2F2",
        "error-light-2": "#ED2E2E",
        "warning": "#A9791C",
        "warning-light-1": "#F4B740",
        "warning-light-2": "#FFF8E1",
        "success": "#00966D",
        "success-light-1": "#00BA88",
        "success-light-2": "#F3FDFA"
      }
    },
  },
  plugins: [],
}

