# Extended live HTTP headers

A simple chrome browser extension that displays the live log with the http request / response headers.

**This repository is created for teaching purpose.**

## How to load

1. Unzip the file `compressed.zip`.
1. Open the Extension Management page by navigating to [chrome://extensions](chrome://extensions).
   - The Extension Management page can also be opened by clicking on the Chrome menu, hovering over More Tools then selecting Extensions.
1. Enable Developer Mode by clicking the toggle switch next to Developer mode.
1. Click the LOAD UNPACKED button and select the extension directory.
1. Load the `dist` directory.

## Permissions

- `debugger` - It is required for capturing HTTP response body.

## Setup

```sh
npm install
```

## Build

```sh
npm run build
```

## Prepare for distributing

```sh
npm run build && npm run zip
```

## Development

```sh
npm run dev
```

## Clean

```sh
npm run clean
```

## Test

```sh
npm run test
```

## Reference

- [https://developer.chrome.com/extensions](https://developer.chrome.com/extensions)
- [Live HTTP headers](https://developer.chrome.com/extensions/samples#search:debugger)
- [https://stackoverflow.com/a/47973302/3718498](https://stackoverflow.com/a/47973302/3718498)
- [https://gist.github.com/niyazpk/f8ac616f181f6042d1e0](https://gist.github.com/niyazpk/f8ac616f181f6042d1e0)
- [https://github.com/chibat/chrome-extension-typescript-starter](https://github.com/chibat/chrome-extension-typescript-starter)
