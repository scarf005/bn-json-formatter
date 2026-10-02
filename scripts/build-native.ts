/// <reference lib="deno.ns" />

import { fromFileUrl, resolve } from "@std/path"

const root = fromFileUrl(new URL("../", import.meta.url))
const source = resolve(
  root,
  Deno.env.get("BN_SOURCE_DIR") ?? "vendor/Cataclysm-BN",
)
const output = resolve(root, "dist/json_formatter-linux-x86_64")

if (Deno.build.os !== "linux" || Deno.build.arch !== "x86_64") {
  throw new Error("The release binary must be built on Linux x86-64")
}

await Deno.mkdir(resolve(root, "dist"), { recursive: true })
const status = await new Deno.Command("g++", {
  args: [
    "-std=c++23",
    "-O2",
    "-static",
    "-s",
    "-DCATA_IN_TOOL",
    `-I${resolve(source, "src")}`,
    resolve(source, "tools/format/format.cpp"),
    resolve(source, "src/json.cpp"),
    resolve(root, "wasm/json_formatter_shim.cpp"),
    "-o",
    output,
  ],
  stdout: "inherit",
  stderr: "inherit",
}).spawn().status
if (!status.success) {
  throw new Error(`Native formatter build failed with ${status.code}`)
}
