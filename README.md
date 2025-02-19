# Aurora

[![Join dialoqbase #welcome](https://img.shields.io/badge/discord-join%20chat-blue.svg)](https://discord.gg/bu54382uBd)

Aurora is an open-source browser extension that provides a sidebar and web UI for your local AI model. It allows you to interact with your model from any webpage.
## Installation

Aurora supports Chromium-based browsers like Chrome, Brave, and Edge, as well as Firefox.

[![Chrome Web Store](https://pub-35424b4473484be483c0afa08c69e7da.r2.dev/UV4C4ybeBTsZt43U4xis.png)](https://chrome.google.com/webstore/detail/page-assist/jfgfiigpkhlkbnfnbobbkinehhfdhndo)
[![Firefox Add-on](https://pub-35424b4473484be483c0afa08c69e7da.r2.dev/get-the-addon.png)](https://addons.mozilla.org/en-US/firefox/addon/page-assist/)

Checkout the Demo (v1.0.0):

<div align="center">

[![Aurora Demo](https://img.youtube.com/vi/8VTjlLGXA4s/0.jpg)](https://www.youtube.com/watch?v=8VTjlLGXA4s)

</div>

## Features

- **Sidebar**: A sidebar that can be opened on any webpage. It allows you to interact with your model and see the results.

- **Web UI**: A web UI that allows you to interact with your model like a ChatGPT Website.

- **Chat With Webpage**: You can chat with the webpage and ask questions about the content.

want more features? Create an issue and let me know.

### Manual Installation

#### Pre-requisites

- Bun - [Installation Guide](https://bun.sh/)
- Ollama (Local AI Provider) - [Installation Guide](https://ollama.com)
- Any OpenAI API Compatible Endpoint (like LM Studio, llamafile etc.)

1. Clone the repository

```bash
git clone https://github.com/n4ze3m/page-assist.git
cd page-assist
```

2. Install the dependencies

```bash
bun install
```

3. Build the extension (by default it will build for Chrome)

```bash
bun run build
```

or you can build for Firefox

```bash
bun build:firefox
```

4. Load the extension (chrome)

- Open the Extension Management page by navigating to `chrome://extensions`.

- Enable Developer Mode by clicking the toggle switch next to Developer mode.

- Click the `Load unpacked` button and select the `build` directory.

5. Load the extension (firefox)

- Open the Add-ons page by navigating to `about:addons`.
- Click the `Extensions` tab.
- Click the `Manage Your Extensions` button.
- Click the `Load Temporary Add-on` button and select the `manifest.json` file from the `build` directory.

## Usage

### Sidebar

Once the extension is installed, you can open the sidebar via context menu or keyboard shortcut.

Default Keyboard Shortcut: `Ctrl+Shift+Y`

### Web UI

You can open the Web UI by clicking on the extension icon which will open a new tab with the Web UI.

Default Keyboard Shortcut: `Ctrl+Shift+L`

Note: You can change the keyboard shortcuts from the extension settings on the Chrome Extension Management page.

## Development

You can run the extension in development mode to make changes and test them.

```bash
bun dev
```

This will start a development server and watch for changes in the source files. You can load the extension in your browser and test the changes.

## Browser Support

| Browser     | Sidebar | Chat With Webpage | Web UI |
| ----------- | ------- | ----------------- | ------ |
| Chrome      | ✅       | ✅                 | ✅      |
| Brave       | ✅       | ✅                 | ✅      |
| Firefox     | ✅       | ✅                 | ✅      |
| Vivaldi     | ✅       | ✅                 | ✅      |
| Edge        | ✅       | ❌                 | ✅      |
| LibreWolf   | ✅       | ✅                 | ✅      |
| Zen Browser | ✅       | ✅                 | ✅      |
| Opera       | ❌       | ❌                 | ✅      |
| Arc         | ❌       | ❌                 | ✅      |

## Local AI Provider

- [Ollama](https://github.com/ollama/ollama)

- Chrome AI (Gemini Nano)

- OpenAI API Compatible endpoints (like LM Studio, llamafile etc.)

## Roadmap

- [x] Firefox Support
- [x] More Local AI Providers
- [ ] More Customization Options
- [ ] Better UI/UX

## Privacy

Aurora does not collect any personal data. The only time the extension communicates with the server is when you are using the share feature, which can be disabled from the settings.

All the data is stored locally in the browser storage. You can view the source code and verify it yourself.

You learn more about the privacy policy [here](PRIVACY.md).

## Contributing

Contributions are welcome. If you have any feature requests, bug reports, or questions, feel free to create an issue.

## Support

If you like the project and want to support it, you can buy me a coffee. It will help me to keep working on the project.

<a href='https://ko-fi.com/M4M3EMCLL' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

or you can sponsor me on GitHub.

## License

MIT