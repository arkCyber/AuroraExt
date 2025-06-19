<p align="center">
    <h1 align="center">AuroraExt</h1>
</p>


<p align="center">
<a href="https://discord.gg/bu54382uBd" aria-label="Join dialoqbase #welcome"><img src="https://img.shields.io/badge/discord-join%20chat-blue.svg" alt="Join dialoqbase #welcome"></a>  <a href="https://twitter.com/arksong2018" aria-label="Follow @arksong2018 on Twitter"><img src="https://img.shields.io/twitter/follow/arksong2018?style=social" alt="Follow @arksong2018 on Twitter"></a> 
</p>

<p align="center">
    <a href="https://github.com/arkCyber/AuroraExt">
        Documentation
    </a>

</p>


**AuroraExt** is an enhanced open-source browser extension based on Aurora that provides a sidebar and web UI for your local AI model with additional blockchain features. It allows you to interact with your model from any webpage while providing secure blockchain wallet functionality.

## Features

- **Enhanced AI Sidebar**: A sidebar that can be opened on any webpage with improved UI/UX
- **Web UI**: A web UI that allows you to interact with your model like a ChatGPT Website
- **Chat With Webpage**: You can chat with the webpage and ask questions about the content
- **Blockchain Integration**: Built-in blockchain wallet functionality with secure key management
- **Multi-language Support**: Comprehensive internationalization support
- **Advanced Settings**: Enhanced configuration options and environment checks

## Installation

AuroraExt supports Chromium-based browsers like Chrome, Brave, and Edge, as well as Firefox.

[![Chrome Web Store](https://pub-35424b4473484be483c0afa08c69e7da.r2.dev/UV4C4ybeBTsZt43U4xis.png)](https://chrome.google.com/webstore/detail/page-assist/jfgfiigpkhlkbnfnbobbkinehhfdhndo)
[![Firefox Add-on](https://pub-35424b4473484be483c0afa08c69e7da.r2.dev/get-the-addon.png)](https://addons.mozilla.org/en-US/firefox/addon/page-assist/)
[![Edge Add-on](https://pub-35424b4473484be483c0afa08c69e7da.r2.dev/edge-addon.png)](https://microsoftedge.microsoft.com/addons/detail/page-assist-a-web-ui-fo/ogkogooadflifpmmidmhjedogicnhooa)

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
git clone https://github.com/arkCyber/AuroraExt.git
cd AuroraExt
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

_Note: If you face any issues with Bun, use `npm` instead of `bun`._

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

Default Keyboard Shortcut: `Ctrl+Shift+2`

### Web UI

You can open the Web UI by clicking on the extension icon which will open a new tab with the Web UI.

Default Keyboard Shortcut: `Ctrl+1`

Note: You can change the keyboard shortcuts from the extension settings on the Chrome Extension Management page.

## Development

You can run the extension in development mode to make changes and test them.

```bash
bun dev
```

This will start a development server and watch for changes in the source files. You can load the extension in your browser and test the changes.

## Browser Support

| Browser     | Sidebar | Chat With Webpage | Web UI | Blockchain |
| ----------- | ------- | ----------------- | ------ | ---------- |
| Chrome      | ✅       | ✅                 | ✅      | ✅          |
| Brave       | ✅       | ✅                 | ✅      | ✅          |
| Firefox     | ✅       | ✅                 | ✅      | ✅          |
| Vivaldi     | ✅       | ✅                 | ✅      | ✅          |
| Edge        | ✅       | ✅                 | ✅      | ✅          |
| LibreWolf   | ✅       | ✅                 | ✅      | ✅          |
| Zen Browser | ✅       | ✅                 | ✅      | ✅          |

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

AuroraExt does not collect any personal data. All blockchain keys and AI conversations are stored locally in the browser storage. You can view the source code and verify it yourself.

You learn more about the privacy policy [here](PRIVACY.md).

## Contributing

Contributions are welcome. If you have any feature requests, bug reports, or questions, feel free to create an issue.

## Support

If you like the project and want to support it, you can:

- Star this repository ⭐
- Report bugs and suggest features
- Contribute to the codebase
- Share with others

## Contact

- **Author**: arkSong
- **Email**: arksong2018@gmail.com
- **GitHub**: [@arkCyber](https://github.com/arkCyber)

## License

MIT License - see [LICENSE](LICENCE) for details.

## Acknowledgments

This project is based on [Aurora](https://github.com/n4ze3m/page-assist) with significant enhancements and additional features.

---

Made with ❤️ by arkSong
