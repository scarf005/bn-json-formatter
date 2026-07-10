import type createBnJsonFormatter from "../public/json_formatter.d.ts"
import type { MainModule } from "../public/json_formatter.d.ts"

type FormatterFactory = typeof createBnJsonFormatter

let formatterPromise: Promise<MainModule> | undefined

const loadFormatter = async () => {
  formatterPromise ??= (async () => {
    const scriptUrl = new URL("json_formatter.js", window.location.href)
      .toString()
    const factory = (await import(/* @vite-ignore */ scriptUrl))
      .default as FormatterFactory
    return factory({
      locateFile: (path: string) => new URL(path, scriptUrl).toString(),
    })
  })()
  return formatterPromise
}

export const formatJson = async (input: string) => {
  const formatter = await loadFormatter()
  const inputSize = formatter.lengthBytesUTF8(input) + 1
  const inputPointer = formatter._malloc(inputSize)
  if (inputPointer === 0) throw new Error("Unable to allocate formatter input.")

  try {
    formatter.stringToUTF8(input, inputPointer, inputSize)
    const result = formatter._format_json(inputPointer)
    if (result === 0) {
      const error = formatter._get_last_error()
      throw new Error(
        error === 0 ? "Syntax error" : formatter.UTF8ToString(error),
      )
    }

    try {
      return formatter.UTF8ToString(result)
    } finally {
      formatter._free_string(result)
    }
  } finally {
    formatter._free(inputPointer)
  }
}
