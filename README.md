# BN JSON Formatter

Web clone of the Cataclysm JSON linting page backed by the Cataclysm: Bright Nights formatter compiled to WebAssembly. Input may contain trailing commas; output is normalized to BN JSON style.

## Running

```sh
deno task build
deno task dev
```

`deno task build` sparse-checks out Cataclysm-BN with `--filter=blob:none`, builds the formatter with Emscripten, then builds the Vite app.

## Temporary native CLI

The [native releases](https://github.com/scarf005/bn-json-formatter/releases) provide BN's original file-formatting CLI for CI until migration to `deno fmt`. Each release pins a BN source commit; consumers should pin the release and verify its SHA-256 digest.

Build on Linux x86-64 with GCC and its static runtime libraries installed:

```sh
BN_SOURCE_DIR=/path/to/Cataclysm-BN deno task build:native
sha256sum dist/json_formatter-linux-x86_64
```

The binary is statically linked. A filename argument formats in place, returning `1` when changed and `0` when unchanged; no argument formats standard input.

## Configuration

- `BN_REPO_URL`: Cataclysm-BN repository URL. Defaults to `https://github.com/cataclysmbn/Cataclysm-BN.git`.
- `BN_REF`: branch, tag, or ref to build. Defaults to `main`.
- `EMXX`: Emscripten C++ compiler. Defaults to `em++`.
