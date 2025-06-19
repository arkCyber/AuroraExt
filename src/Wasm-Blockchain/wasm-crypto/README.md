# Wasm Crypto

A WebAssembly-based cryptographic library for wallet generation and digital signatures.

## Features

- Wallet generation from mnemonic phrases
- Digital signature generation and verification
- Support for multiple blockchain types (ETH, BSC, etc.)
- Browser-based device ID generation
- Secure key management

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- pnpm (v6 or later)
- Rust (for WebAssembly compilation)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wasm-crypto.git
cd wasm-crypto
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the WebAssembly module:
```bash
pnpm build:wasm
```

4. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Usage

1. Generate a wallet using your device ID
2. Sign messages using your private key
3. Verify signatures using the public key
4. Export wallet information as needed

## Development

### Project Structure

```
wasm-crypto/
├── src/                    # React application source code
├── wasm/                   # WebAssembly module source code
├── public/                 # Static assets
└── package.json           # Project dependencies and scripts
```

### Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm build:wasm` - Build the WebAssembly module
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint

## License

This project is licensed under the MIT License - see the LICENSE file for details.
