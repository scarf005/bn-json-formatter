import "./App.css"
import { createSignal } from "solid-js"
import { formatJson } from "./formatter.ts"

function App() {
  const [data, setData] = createSignal("")
  const [busy, setBusy] = createSignal(false)

  const lint = async (event: SubmitEvent) => {
    event.preventDefault()
    if (data().length === 0 || busy()) return

    setBusy(true)
    try {
      setData(await formatJson(data()))
    } catch (error) {
      alert(
        error instanceof Error && error.message.length > 0
          ? error.message
          : "Syntax error",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Cataclysm: Bright Nights JSON Web Linting Tool</h1>
      <p>
        This is a tool to help modders and editors of the open source game{" "}
        <a href="https://github.com/cataclysmbn/Cataclysm-BN">
          Cataclysm: Bright Nights
        </a>{" "}
        write JSON in the game's expected format.
      </p>
      <p>
        Paste some JSON into the field below and click "Lint" to run an
        autoformatter against it.
      </p>
      <form onSubmit={lint} aria-busy={busy()}>
        <textarea
          name="data"
          rows="30"
          placeholder="Paste JSON here"
          value={data()}
          disabled={busy()}
          onInput={(event) => setData(event.currentTarget.value)}
        />
        <input
          type="submit"
          value={busy() ? "Linting" : "Lint"}
          disabled={busy()}
        />
      </form>
    </main>
  )
}

export default App
