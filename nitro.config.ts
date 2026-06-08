import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  cloudflare: {
    deployConfig: false,
    nodeCompat: true,
  },
});