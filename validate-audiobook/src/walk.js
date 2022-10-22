import path from 'path'
import crypto from 'node:crypto'

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { parseFile } from 'music-metadata'
// Internal
import {
  getDirectories,
  getFiles,
  filterAudioFileExtensions,
  filterNonAudioExtensionsOrNames
} from './traverse/module.js'
import { searchAudible, sortAudibleBooks, ffprobe } from './extApi/module.js'
import { getAuthor, getTitle, getSkip } from './hints/authorTitle.js'
import { formatElapsed, durationToHMS } from './time/module.js'

const defaultRootPath = '/Volumes/Space/archive/media/audiobooks'
const _rewriteHintDB = true

function rewriteHint (...args) {
  if (_rewriteHintDB) {
    console.log(...args)
  }
}

await main()

async function main () {
  const argv = await yargs(hideBin(process.argv))
    .option('rootPath', {
      alias: 'r',
      type: 'string',
      demandOption: true,
      default: defaultRootPath,
      describe: 'Path of the root directory to search from'
    })
    .parseAsync()
  // destructure arguments
  const { rootPath: unverifiedRootPath } = argv
  // clean the root path by removing trailing slash
  const rootPath = unverifiedRootPath.replace(/\/$/, '')
  // could check if path exists

  // Global validation
  if (false) {
    const allFiles = await getFiles(rootPath, { recurse: true })
    // console.error(`Got ${allFiles.length} files in`, formatElapsed(startMs))
    verifyExtensionsAllAccountedFor(allFiles)
  }

  const startMs = +new Date()
  const directories = await getDirectories(rootPath)
  console.error(
    `Got ${directories.length} directories in`,
    formatElapsed(startMs)
  )

  rewriteHint('// cSpell:disable')
  rewriteHint('export const db = {')
  // per directory validation
  for (const directoryPath of directories) {
    const bookData = await classifyDirectory(directoryPath)
    validateDirectory(directoryPath, bookData)
    rewriteDirectory(directoryPath, bookData)
  }
  rewriteHint('}')

  // console.error('Done in', formatElapsed(startMs))
}

async function validateDirectory (directoryPath, bookData) {
  const validations = []
  console.error('=-=-: Validate', directoryPath.substring(39))
  if (bookData.audioFileCount == 0) {
    console.error('=-=-: No audio files', directoryPath.substring(39))
  } else {
    if (bookData.meta.count == 0) {
      console.error(
        '=-=-: no metadata for audio files',
        directoryPath.substring(39)
      )
    }

    const okAuthor =
      !!bookData.author || isUniqueAndTruthy(bookData.meta.authorDedup)
    if (!okAuthor) {
      console.error(
        `Missing author and non-unique tags: ${JSON.stringify(
          bookData.meta.authorDedup
        )}`
      )
    }
    const okTitle =
      !!bookData.title || isUniqueAndTruthy(bookData.meta.titleDedup)
    if (!okTitle) {
      console.error(
        `Missing title and non-unique tags: ${JSON.stringify(
          bookData.meta.titleDedup
        )}`
      )
    }

    // total duration from metadata
    if (!bookData.meta.duration) {
      console.error('Missing audio files duration =>', {
        duration: bookData.meta.duration
      })
    }

    const skipHint = bookData.skip
    if (skipHint || !okAuthor || !okTitle) {
      console.error(
        `Skipping audible ${JSON.stringify({ skipHint, okAuthor, okTitle })} `
      )
    } else {
      if (bookData.audible.length == 0) {
        console.error({ skipHint })
        console.error(`No audible results (${bookData.audible.length})`, {
          author: bookData.author,
          title: bookData.title
        })
      }
      console.error(`- Audible (${bookData.audible.length})`)
      // find the closest match - and print the delta
      {
        const durationMeta = bookData.meta.duration // rename to avoid shadowing
        const sortedAudible = sortAudibleBooks(bookData.audible, durationMeta)
        const deltaThreshold = 3 * 60 // 3 minutes
        const largeDuration = 1e7
        sortedAudible.forEach((book, index) => {
          const { asin, duration, title, authors, narrators } = book
          const delta = duration
            ? Math.abs(duration - durationMeta)
            : largeDuration
          const check = delta <= deltaThreshold ? '✓' : '✗'
          console.error(
            `${check} - ${index} ${asin} 'Δ':${durationToHMS(
              delta
            )} ${durationToHMS(
              duration
            )} - ${title} / ${authors} / n: ${narrators}`
          )
        })
      }
    }
  }
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
        rewriteHint('  "author": "", // non-unique or falsy')
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
        rewriteHint('  "title": "", // non-unique or falsy')
        rewriteHint(
          '  "// Non-unique Title":',
          JSON.stringify(bookData.meta.titleDedup),
          ','
        )
      }
    }

    // total duration
    if (!bookData.meta.duration) {
      console.error('Missing audio files duration =>', {
        duration: bookData.meta.duration
      })
    }
    rewriteHint(
      '  "// duration":',
      JSON.stringify(durationToHMS(bookData.meta.duration)),
      ','
    )

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
        {
          const durationMeta = bookData.meta.duration // rename to avoid shadowing
          const sortedAudible = sortAudibleBooks(bookData.audible, durationMeta)
          // const deltaThreshold = 3 * 60 // 3 minutes
          const largeDuration = 1e7
          sortedAudible.forEach((book, index) => {
            const { asin, duration, title, authors, narrators } = book
            // const delta = duration
            //   ? Math.abs(duration - durationMeta)
            //   : largeDuration
            // const check = delta <= deltaThreshold ? '✓' : '✗'
            rewriteHint(
              `  "// asin-${index}":`,
              JSON.stringify({
                asin,
                duration: durationToHMS(duration)
                // delta: durationToHMS(delta)
                // check
              }),
              ','
            )
            rewriteHint(
              `  "// meta-${index}":`,
              JSON.stringify(`${title} / ${authors} / n: ${narrators}`),
              ','
            )
          })
        }
      } else {
        console.error('skip audible')
      }
    }
  }
  rewriteHint('},')
}

// export a data structure for the directory
async function classifyDirectory (directoryPath) {
  const bookData = {
    audioFileCount: 0,
    author: '',
    title: '',
    meta: {
      count: 0,
      duration: 0, // aggregated sum, 0 if sum is NaN
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

    if (false) {
      console.error(
        '******',
        JSON.stringify(
          metas[0],
          (key, value) => {
            if (key === 'data' && Array.isArray(value)) return '[removed]'
            if (key === 'warnings' && Array.isArray(value)) return '[removed]'
            return value
          },
          2
        )
      )
    }
    const dedupFormat = dedupArray(
      metas.map(m => {
        const { container, codec, codecProfile, bitrate } = m.format
        return JSON.stringify({ container, codec, codecProfile, bitrate })
      })
    )
    bookData.meta.formatDedup = dedupFormat

    // m.common.picture {format,data,type?,description?}
    const dedupCover = dedupArray(
      metas.map(m => {
        // careful picture is an array
        const { format, data, type, description } = m.common.picture?.[0] || {}
        // data is a Buffer
        const sha256 = data
          ? crypto
            .createHash('sha256')
            .update(data)
            .digest('hex')
          : 'missing'

        return JSON.stringify({ format, sha256, type, description })
      })
    )
    bookData.meta.coverDedup = dedupCover

    // total duration
    const duration = Math.round(
      metas
        .map(m => m.format.duration)
        .reduce((total, duration) => total + duration, 0)
    )
    // set to 0 if NaN (NaN is Falsy, and so is 0, so should be safe)
    bookData.meta.duration = duration || 0

    // copy skip content
    const skipHint = getSkip(directoryPath)
    if (skipHint) {
      bookData.skip = skipHint
    }

    if (okAuthorTitle && !skipHint) {
      // console.error('.. Lookup asin', directoryPath.substring(39))
      // console.error('author,title =>', { author, title })

      // TODO(daneroo) and neither is falsy
      const doAudible = true
      if (doAudible) {
        if (okAuthorTitle) {
          bookData.audible = await searchAudible({ author, title })
        }
      }
    }
  }
  return bookData
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
    author: authorHint || dedupAuthor[0],
    title: titleHint || dedupTitle[0],
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
    // ffprobe fallback for duration
    if (!metadata.format.duration) {
      const ffprobeMeta = await ffprobe(filename)
      metadata.format.duration = Number(ffprobeMeta.format.duration)
      console.error('ffprobe duration', ffprobeMeta.format.duration, filename)
    }
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
