// @ts-check
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { searchAudible, sortAudibleBooks } from './extApi/module.js'

main()

async function main () {
  const argv = await yargs(hideBin(process.argv))
    .option('author', {
      alias: 'a',
      type: 'string',
      describe: 'specify author for search'
    })
    .option('title', {
      alias: 't',
      type: 'string',
      describe: 'specify author for search'
    })
    .demandOption(
      ['author', 'title'],
      'Please provide both author and title arguments to work with this tool'
    )
    .help()
    .parseAsync()

  // destructure arguments
  const { author, title } = argv
  const audibleBooks = await searchAudible({ author, title })
  console.log(`Got ${audibleBooks.length} results from audible API`)
  const sorted = sortAudibleBooks(audibleBooks)
  sorted.forEach(book => {
    console.log(JSON.stringify(book))
  })
}
