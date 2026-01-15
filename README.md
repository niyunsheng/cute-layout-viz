<div align="center">
  <img src="public/logo.svg" alt="Cute Layout Visualizer Logo" width="150">
  <h1>Cute Layout Visualizer</h1>
  <p>An interactive visualization tool for learning CUTLASS 4.0 Cute Layout operations.</p>
</div>

## Live Demo

🔗 [https://niyunsheng.github.io/cute-layout-viz/](https://niyunsheng.github.io/cute-layout-viz/)

## Tech Stack

### Web Application
- React 19 + TypeScript + Vite
- Pyodide (Python in WebAssembly)
- GitHub Pages

### Python Package
- Python 3.7+
- pandas for tabular output

## Quick Start

### Web Application

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

### Python Package

```bash
pip install git+https://github.com/niyunsheng/cute-layout-viz.git#subdirectory=python
```

See [python/README.md](python/README.md) for detailed documentation and usage examples.

## Related Resources

- [CUTLASS GitHub Repository](https://github.com/NVIDIA/cutlass)
- [CUTLASS Python DSL Overview](https://docs.nvidia.com/cutlass/latest/media/docs/pythonDSL/overview.html)
- [CuTe Layout Documentation](https://docs.nvidia.com/cutlass/latest/media/docs/cpp/cute/01_layout.html)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- This project was developed with the assistance of [Claude Sonnet 4.5](https://claude.com/product/overview) and [Gemini 3 Pro](https://deepmind.google/models/gemini/).
- The project logo is an original design created with multiple iterations using [nano banano](https://nanobanano.app/).
