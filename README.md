# BN JSON Formatter

Web clone of the Cataclysm JSON linting page backed by the Cataclysm: Bright Nights formatter compiled to WebAssembly. Input may contain trailing commas; output is normalized to BN JSON style.

## Running

```sh
deno task build
deno task dev
```

`deno task build` sparse-checks out Cataclysm-BN with `--filter=blob:none`, builds the formatter with Emscripten, then builds the Vite app.

## Configuration

- `BN_REPO_URL`: Cataclysm-BN repository URL. Defaults to `https://github.com/cataclysmbn/Cataclysm-BN.git`.
- `BN_REF`: branch, tag, or ref to build. Defaults to `main`.
- `EMXX`: Emscripten C++ compiler. Defaults to `em++`.
