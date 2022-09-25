import fetch from 'node-fetch'
// import { string } from 'yargs'

await main()

async function main () {
  // const asin = 'B00G4K7EUO' // GB03 =23h  - '0593163400' == 26h
  const asin = 'B078P2MS47' // Adam Becker - What Is Real?
  const url = `https://api.audnex.us/books/${asin}/chapters`
  console.error('fetching', { url })
  // curl --silent https://api.audnex.us/books/B014LL6R5U/chapters | jq
  const response = await fetch(url)
  const data = await response.json()
  console.log(`# Chapter for asin:${asin} metadata from:`)
  console.log(`#  ${url}`)
  const { runtimeLengthSec, runtimeLengthMs, chapters } = data
  // formatted as ## total-duration:: 23:45:53.617
  const duration = hmsMillis(runtimeLengthMs)
  // .substring(11, 11 + 8)

  console.log(
    `## total-duration:: ${duration} - ${runtimeLengthMs}ms - ${runtimeLengthSec}s`
  )
  // "chapters": [
  //   {
  //     "lengthMs": 13082,
  //     "startOffsetMs": 0,
  //     "startOffsetSec": 0,
  //     "title": "Opening Credits"
  //   },...]
  for (const ch of chapters) {
    const { startOffsetMs, title } = ch
    // console.log(JSON.stringify(ch))
    console.log(`${hmsMillis(startOffsetMs)} ${title}`)
  }

  //  console.log(JSON.stringify(data, null, 2))
}

function hmsMillis (ms) {
  // 23:45:53.617
  return new Date(ms).toISOString().substring(11, 23)
}
