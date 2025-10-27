# Ticket Builder

A WYSIWYG ticket generator for creating sequential numbered tickets with batch export capabilities.

## Features

- **WYSIWYG Design**: What You See Is What You Get - preview matches export exactly
- **Batch Export**: Generate 1-500 sequential tickets in one operation
- **Canva Import**: Upload PNG/JPEG designs from Canva for numbering
- **Flexible Numbering**: Custom prefix, padding, start/end values
- **ZIP Bundling**: Single download for batch exports
- **Print-Ready**: High-quality PNG/JPEG output at 300 DPI

## Quick Start

### Prerequisites
- Node.js 18+
- Yarn

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/samuelmholley1/ticket_numberer.git
cd ticket_numberer
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
yarn build
yarn start
```

### Export Testing

To test the export functionality:

```bash
yarn test:smoke
```

This runs a smoke test that exports 3 sample tickets and verifies the filenames.

## Usage

1. Design your ticket in Canva or use the built-in template
2. Upload your design (PNG/JPEG) or customize the template
3. Set batch parameters (count, prefix, padding)
4. Click "Export All" to generate and download your tickets

## Architecture

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Export**: html-to-image + html2canvas
- **Testing**: Playwright
- **Package Manager**: Yarn Berry

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## License

This project is private and proprietary.