# BabiesiQ SMM

Static BabiesiQ SMM dashboard for `smm.babiesiq.tech`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/uttamkumar009/SMM)

The frontend calls `https://api.smm.babiesiq.tech/api` by default. Services and order IDs are loaded through the backend; the provider API key never reaches the browser.

## Vercel deployment

1. Click the button above or import this repository in Vercel.
2. Keep the framework preset as **Other** and leave the build command empty.
3. Set the project domain to `smm.babiesiq.tech`.
4. Ensure the API allows the Vercel domain in its CORS configuration.
