import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  cloudflare: {
    deployConfig: false,
    nodeCompat: true,
  },
});