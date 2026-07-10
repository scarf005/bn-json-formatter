// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
declare namespace RuntimeExports {
  function lengthBytesUTF8(str: any): number
  function stringToUTF8(str: any, outPtr: any, maxBytesToWrite: any): any
  /**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  function UTF8ToString(
    ptr: number,
    maxBytesToRead?: number | undefined,
    ignoreNul?: boolean | undefined,
  ): string
}
interface WasmModule {
  _format_json(_0: number): number
  _malloc(_0: number): number
  _get_last_error(): number
  _free_string(_0: number): void
  _free(_0: number): void
}

export type MainModule = WasmModule & typeof RuntimeExports
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>
