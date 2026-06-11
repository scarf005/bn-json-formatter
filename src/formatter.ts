type FormatterModule = {
  ccall: (
    name: string,
    returnType: "number" | "string" | null,
    argTypes: ("string" | "number")[],
    args: (string | number)[],
  ) => number | string | null
  UTF8ToString: (pointer: number) => string
}

type FormatterFactory = (options: {
  locateFile: (path: string) => string
}) => Promise<FormatterModule>

let formatterPromise: Promise<FormatterModule> | undefined

const loadFormatter = async () => {
  formatterPromise ??= (async () => {
    const scriptUrl = new URL("json_formatter.js", window.location.href)
      .toString()
    const factory = (await import(/* @vite-ignore */ scriptUrl))
      .default as FormatterFactory
    return factory({
      locateFile: (path) => new URL(path, scriptUrl).toString(),
    })
  })()
  return formatterPromise
}

export async function formatJson(input: string) {
  const formatter = await loadFormatter()
  const result = formatter.ccall("format_json", "number", ["string"], [
    input,
  ]) as number
  if (result === 0) {
    const error = formatter.ccall("get_last_error", "number", [], []) as number
    throw new Error(
      error === 0 ? "Syntax error" : formatter.UTF8ToString(error),
    )
  }

  try {
    return formatter.UTF8ToString(result)
  } finally {
    formatter.ccall("free_string", null, ["number"], [result])
  }
}
