import config from "@kembali/config/eslint";

export default [
  { ignores: ["ios/**", "android/**", "web-stub/**"] },
  ...config,
  // plain node scripts, not bundled code
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
  },
];
