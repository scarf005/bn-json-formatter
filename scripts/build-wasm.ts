/// <reference lib="deno.ns" />

import "typescript"

const root = new URL("../", import.meta.url)
const path = (relative: string) => new URL(relative, root).pathname

const bnDir = path("vendor/Cataclysm-BN/")
const repoUrl = Deno.env.get("BN_REPO_URL") ??
  "https://github.com/cataclysmbn/Cataclysm-BN.git"
const ref = Deno.env.get("BN_REF") ?? "main"
const emxx = Deno.env.get("EMXX") ?? "em++"
const commandPath = `${
  new URL("../bin/", import.meta.resolve("typescript")).pathname
}${Deno.build.os === "windows" ? ";" : ":"}${Deno.env.get("PATH") ?? ""}`

async function exists(target: string) {
  try {
    await Deno.stat(target)
    return true
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false
    throw error
  }
}

async function run(command: string, args: string[]) {
  const status = await new Deno.Command(command, {
    args,
    cwd: root.pathname,
    stdout: "inherit",
    stderr: "inherit",
    env: { PATH: commandPath },
  }).spawn().status
  if (!status.success) {
    throw new Error(`${command} ${args.join(" ")} failed with ${status.code}`)
  }
}

await Deno.mkdir(path("vendor/"), { recursive: true })
await Deno.mkdir(path("public/"), { recursive: true })

if (!(await exists(path("vendor/Cataclysm-BN/.git")))) {
  await run("git", [
    "clone",
    "--filter=blob:none",
    "--sparse",
    "--no-checkout",
    repoUrl,
    bnDir,
  ])
} else {
  await run("git", ["-C", bnDir, "remote", "set-url", "origin", repoUrl])
}

await run("git", ["-C", bnDir, "sparse-checkout", "init", "--no-cone"])
await run("git", [
  "-C",
  bnDir,
  "sparse-checkout",
  "set",
  "/tools/format/",
  "/src/*.h",
  "/src/json.cpp",
])
await run("git", ["-C", bnDir, "fetch", "--depth=1", "origin", ref])
await run("git", ["-C", bnDir, "checkout", "--detach", "FETCH_HEAD"])

await run(emxx, [
  "-std=c++20",
  "-O3",
  "-DCATA_IN_TOOL",
  `-I${path("vendor/Cataclysm-BN/src/")}`,
  path("wasm/json_formatter.cpp"),
  path("vendor/Cataclysm-BN/src/json.cpp"),
  path("wasm/json_formatter_shim.cpp"),
  "--no-entry",
  "-sALLOW_MEMORY_GROWTH=1",
  "-sENVIRONMENT=web",
  "-sEXPORT_ES6=1",
  "-sEXPORT_NAME=createBnJsonFormatter",
  '-sEXPORTED_FUNCTIONS=["_format_json","_free","_free_string","_get_last_error","_malloc"]',
  '-sEXPORTED_RUNTIME_METHODS=["lengthBytesUTF8","stringToUTF8","UTF8ToString"]',
  "-sMODULARIZE=1",
  "--emit-tsd",
  path("public/json_formatter.d.ts"),
  "-o",
  path("public/json_formatter.js"),
])
await run(Deno.execPath(), ["fmt", path("public/json_formatter.d.ts")])
