import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { parseFile } from 'music-metadata'
// import inspect from 'object-inspect'

import {
  getDirectories,
  getFiles,
  filterAudioFileExtensions,
  filterNonAudioExtensionsOrNames
} from './traverse/module.js'
import { searchAudible } from './extApi/module.js'
import { getAuthor, getTitle, getSkip } from './hints/authorTitle.js'

const defaultRootPath = '/Volumes/Space/archive/media/audiobooks/'
const _rewriteHintDB = true
function rewriteHint (...args) {
  if (_rewriteHintDB) {
    console.log(...args)
  }
}

await main()

async function main () {
  const argv = yargs(hideBin(process.argv)).option('rootPath', {
    alias: 'r',
    type: 'string',
    demandOption: true,
    default: defaultRootPath,
    describe: 'Path of the root directory to search from'
  }).argv
  // destructure arguments
  const { rootPath } = argv

  // const startMs = +new Date()

  // Global validation
  if (false) {
    const allFiles = await getFiles(rootPath, { recurse: true })
    // console.error(`Got ${allFiles.length} files in`, formatElapsed(startMs))
    verifyExtensionsAllAccountedFor(allFiles)
  }

  const directories = await getDirectories(rootPath)
  // console.error(
  //   `Got ${directories.length} directories in`,
  //   formatElapsed(startMs)
  // )

  rewriteHint('export const db = {')
  // per directory validation
  for (const directoryPath of directories) {
    const bookData = await classifyDirectory(directoryPath)
    rewriteDirectory(directoryPath, bookData)
  }
  rewriteHint('}')

  // console.error('Done in', formatElapsed(startMs))
}

async function rewriteDirectory (directoryPath, bookData) {
  rewriteHint(`"${directoryPath}": {`)

  if (bookData.audioFileCount == 0) {
    console.error('=-=-: No audio files', directoryPath.substring(39))
    rewriteHint('  "// No audio files": null,')
  } else {
    if (bookData.meta.count == 0) {
      console.error(
        '=-=-: no metadata for audio files',
        directoryPath.substring(39)
      )
      rewriteHint('  "// No metadata": null,')
    }

    const okAuthorTitle =
      (!!bookData.author || isUniqueAndTruthy(bookData.meta.authorDedup)) &&
      (!!bookData.title || isUniqueAndTruthy(bookData.meta.titleDedup))

    if (bookData.author) {
      // prefer unique dedup'd over hint, as a comment, if it is the same as the hint
      if (
        isUniqueAndTruthy(bookData.meta.authorDedup) &&
        bookData.author === bookData.meta.authorDedup[0]
      ) {
        rewriteHint(`  "author": "${bookData.author}",  // unique`)
      } else {
        rewriteHint(`  "author": "${bookData.author}",  // hint`)
      }
    } else {
      if (isUniqueAndTruthy(bookData.meta.authorDedup)) {
        rewriteHint(`  "author": "${bookData.meta.authorDedup[0]}", // unique`)
      } else {
        rewriteHint(`  "author": "", // non-unique or falsy`)
        rewriteHint(
          '  "// Non-unique Author":',
          JSON.stringify(bookData.meta.authorDedup),
          ','
        )
      }
    }
    if (bookData.title) {
      // prefer unique dedup'd over hint, as a comment, if it is the same as the hint
      if (
        isUniqueAndTruthy(bookData.meta.titleDedup) &&
        bookData.title === bookData.meta.titleDedup[0]
      ) {
        rewriteHint(`  "title": "${bookData.title}",  // unique`)
      } else {
        rewriteHint(`  "title": "${bookData.title}",  // hint`)
      }
    } else {
      if (isUniqueAndTruthy(bookData.meta.titleDedup)) {
        rewriteHint(`  "title": "${bookData.meta.titleDedup[0]}", // unique`)
      } else {
        rewriteHint(`  "title": "", // non-unique or falsy`)
        rewriteHint(
          '  "// Non-unique Title":',
          JSON.stringify(bookData.meta.titleDedup),
          ','
        )
      }
    }

    // total duration
    const { seconds, minutes } = bookData.meta.duration
    if (!seconds) {
      console.error('****:Missing audio files duration =>', {
        seconds,
        minutes
      })
    }
    rewriteHint('  "// duration":', JSON.stringify({ seconds, minutes }), ',')

    const skipHint = bookData.skip
    if (!okAuthorTitle || skipHint) {
      console.error(
        `=-=-: Skip ${JSON.stringify({ okAuthorTitle, skipHint })} `,
        directoryPath.substring(39)
      )
      if (skipHint) {
        rewriteHint(`  "skip": "${skipHint}",`)
      } else {
        rewriteHint('  "// Invalid author or title": "FIX NOW!",')
      }
    } else {
      // TODO(daneroo) and neither is falsy
      if (okAuthorTitle) {
        if (bookData.audible.length == 0) {
          console.error(`No audible results (${bookData.audible.length})`, {
            author: bookData.author,
            title: bookData.title
          })
          rewriteHint('  "// asin lookup results": "zero!",')
        }
        bookData.audible.forEach((book, index) => {
          const { asin, minutes, title, authors, narrators } = book
          rewriteHint(
            `  "// asin-${index}":`,
            JSON.stringify({ asin, minutes }),
            ','
          )
          rewriteHint(
            `  "// meta-${index}":`,
            JSON.stringify(`${title} / ${authors} / n: ${narrators}`),
            ','
          )
        })
      } else {
        console.error('skip audible')
      }
    }
  }
  rewriteHint(`},`)
}

// export a data structure for the directory
async function classifyDirectory (directoryPath) {
  const bookData = {
    audioFileCount: 0,
    author: '',
    title: '',
    meta: {
      count: 0,
      duration: { seconds: 0, minutes: 0 }, // aggregated sum, both in seconds and minutes for convenience
      authorDedup: [],
      titleDedup: []
    },
    audible: [], // from audible lookup (author, title) => [shortBook]
    skip: undefined
  } // this is what we return

  const filenames = await getFiles(directoryPath)

  // just console.error's exceptions
  if (false) {
    verifyExtensionsAllAccountedFor(filenames)
  }

  const audioFiles = filenames.filter(filterAudioFileExtensions)
  bookData.audioFileCount = audioFiles.length

  if (audioFiles.length > 0) {
    const metas = await getMetadataForMultipleFiles(audioFiles)
    bookData.meta.count = metas.length

    // Validate that these fields are unique for the whole audio file collection
    bookData.author = getAuthor(directoryPath)
    bookData.title = getTitle(directoryPath)
    const {
      valid: okAuthorTitle,
      author,
      title,
      dedupAuthor,
      dedupTitle
    } = validateUniqueAuthorTitle(metas, directoryPath)
    bookData.meta.authorDedup = dedupAuthor
    bookData.meta.titleDedup = dedupTitle

    // total duration
    const seconds = Math.round(
      metas
        .map(m => m.format.duration)
        .reduce((total, duration) => total + duration, 0)
    )
    const minutes = Math.round(seconds / 60)
    bookData.meta.duration = { seconds, minutes }

    // copy skip content
    const skipHint = getSkip(directoryPath)
    if (skipHint) {
      bookData.skip = skipHint
    }

    if (!okAuthorTitle || skipHint) {
    } else {
      // Now validate total duration against audible lookup runtime_length_min

      console.error('=-=-: Lookup asin', directoryPath.substring(39))
      // console.error('author,title =>', { author, title })

      // TODO(daneroo) and neither is falsy
      const doAudible = true
      if (doAudible) {
        if (okAuthorTitle) {
          const results = await searchAudible({ author, title })
          results.products.forEach((book, index) => {
            bookData.audible.push(shortBook(book))
          })
        }
      }
    }
  }
  return bookData
}

function shortBook (book) {
  const {
    asin,
    authors,
    title,
    narrators,
    series,
    runtime_length_min: minutes
  } = book

  return {
    asin,
    authors: authors.map(author => author?.name),
    title,
    series: series?.[0].title,
    seriesPosition: series?.[0].sequence,
    narrators: narrators?.map(author => author?.name),
    minutes
  }
}

// returns {valid:,author:,title:,dedupAuthor:,dedupTitle:}
function validateUniqueAuthorTitle (metas, directoryPath) {
  if (metas.length == 0) {
    // console.error(`${directoryPath} has ${metas.length} entries`)
    return { valid: false } // to prevent further lookup and processing
  }

  // get hint from db to override tag aggregates
  const authorHint = getAuthor(directoryPath)
  const titleHint = getTitle(directoryPath)
  const dedupAuthor = dedupArray(metas.map(m => m.common.artist))
  const dedupTitle = dedupArray(metas.map(m => m.common.album))

  const valid =
    (authorHint || isUniqueAndTruthy(dedupAuthor)) &&
    (titleHint || isUniqueAndTruthy(dedupTitle))
  return {
    valid,
    author: authorHint ? authorHint : dedupAuthor[0],
    title: titleHint ? titleHint : dedupTitle[0],
    dedupAuthor,
    dedupTitle
  }
}

// dedup'd array is ok, if it has exactly one entry, which is not falsy: (null or empty)
function isUniqueAndTruthy (dedupAry) {
  if (dedupAry.length > 1 || dedupAry.length == 0) return false
  // now we have a single entry
  const first = dedupAry[0]
  // might trim the value?
  if (!first) return false
  return true
}

// remove duplicates from array
function dedupArray (ary) {
  const dedup = [...new Set(ary)]
  return dedup
}

// for filenames in a set (typically a directory),
// verify that all extensions (and some known filenames are accounted for)
// simply console.error the unaccounted for files files.
function verifyExtensionsAllAccountedFor (filenames) {
  const excludedFilenames = filenames.filter(filterNonAudioExtensionsOrNames)

  const audioFiles = filenames.filter(filterAudioFileExtensions)

  // make sure all extensions are known, or known to be excluded
  if (audioFiles.length + excludedFilenames.length !== filenames.length) {
    const unclassified = filenames.filter(filePath => {
      if (filterAudioFileExtensions(filePath)) return false
      if (filterNonAudioExtensionsOrNames(filePath)) return false
      return true
    })
    console.error(
      'Got ',
      {
        total: filenames.length,
        excluded: excludedFilenames.length,
        audio: audioFiles.length,
        unclassified: unclassified.length
      },
      'files'
    )
    // console.error(
    //   `  Got ${audioFiles.length} audio files ${excludedFilenames.length} excluded files and ${unclassified.length} unclassified files`
    // )
    console.error(JSON.stringify({ unclassified }, null, 2))
    return false
  }
  return true
}

// get metadata for a collection of audio files (typically a directory)
async function getMetadataForMultipleFiles (
  audioFiles,
  options = {
    duration: false, // much slower when true even for some .mp3
    includeChapters: false
  }
) {
  const metas = []
  for (const filename of audioFiles) {
    // console.error('  processing', filename)
    const metadata = await getMetadataForSingleFile(filename, options)
    // console.log(inspect(metadata.common, { showHidden: true, depth: null }))
    // const { codec, container } = metadata.format
    // const { artist, artists, album } = metadata.common
    // console.log('  - ', JSON.stringify({ artist, album }))
    metas.push(metadata)
  }
  return metas
}

// get metadata for a single audio file
async function getMetadataForSingleFile (filePath, options) {
  // get metadata
  if (filterNonAudioExtensionsOrNames(filePath)) {
    return
  }
  const startMs = +new Date()
  try {
    const metadata = await parseFile(filePath, options)
    return metadata
  } catch (error) {
    console.error(
      formatElapsed(startMs),
      path.extname(filePath),
      error.message,
      path.basename(filePath)
    )
  }
  return metadata
}

function formatElapsed (startMs) {
  const elapsedSeconds = ((+new Date() - startMs) / 1000).toFixed(3)
  return elapsedSeconds + 's'
}
