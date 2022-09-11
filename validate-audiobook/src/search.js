import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { searchAudible } from './extApi/module.js'

main()

async function main () {
  const argv = yargs(hideBin(process.argv))
    .option('author', {
      alias: 'a',
      describe: 'specify author for search'
    })
    .option('title', {
      alias: 't',
      describe: 'specify author for search'
    })
    .demandOption(
      ['author', 'title'],
      'Please provide both author and title arguments to work with this tool'
    )
    .help().argv

  // destructure arguments
  const { author, title } = argv
  const results = await searchAudible({ author, title })
  // console.log(JSON.stringify(data, null, 2))
  console.log(`Got ${results.products.length} results`)
  results.products.forEach(book => {
    const { asin, authors, narrators, runtime_length_min, series } = book
    console.log({ asin, title, authors, narrators, runtime_length_min, series })
  })
}
