# HMAC Signature Generator/Verifier Widget

A web-based tool for generating and verifying HMAC signatures using the Web Crypto API.

## 🌐 Live Demo

**[Try the tool online at https://www.authgear.com/tools/hmac-signature-generator-verifier](https://www.authgear.com/tools/hmac-signature-generator-verifier)**

## Features

- Generate HMAC signatures (HS256, HS384, HS512)
- Verify received signatures
- Hex/Base64 encoding options
- Real-time generation and verification
- Copy to clipboard functionality
- Client-side only (no server storage)

## Quick Start

```bash
npm install
npm run dev      # Development
npm run build    # Production
```

## Usage

1. Enter payload content
2. Provide webhook secret
3. Select algorithm (HS256/HS384/HS512)
4. Choose encoding (Hex/Base64)
5. Signature generates automatically
6. Paste received signature to verify

## Tech Stack

- React 18 + TypeScript
- Vite
- Web Crypto API
- Inter Font

## Security

- All operations client-side
- No external crypto dependencies
- Web Crypto API only
- Secrets never leave browser

## Browser Support

Chrome 37+, Firefox 34+, Safari 11+, Edge 12+

## License

MIT License 