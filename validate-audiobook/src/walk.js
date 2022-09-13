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
import { getAuthor, getTitle } from './hints/authorTitle.js'

const defaultRootPath = '/Volumes/Space/archive/media/audiobooks/'
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

  // per directory validation
  for (const directoryPath of directories) {
    await classifyDirectory(directoryPath)
  }

  // console.error('Done in', formatElapsed(startMs))
}

async function classifyDirectory (directoryPath) {
  // console.error('=-=-:', directoryPath.substring(39))
  const filenames = await getFiles(directoryPath)

  // just console.error's exceptions
  if (false) {
    verifyExtensionsAllAccountedFor(filenames)
  }

  const audioFiles = filenames.filter(filterAudioFileExtensions)

  const metas = await getMetadataForMultipleFiles(audioFiles)

  // Validate that these fields are unique for the whole audio file collection
  const okAuthorTitle = validateUniqueAuthorTitle(metas, directoryPath)

  // total duration
  // const totalDuration = metas
  //   .map(m => m.format.duration)
  //   .reduce((total, duration) => total + duration, 0)
  // console.log('=', {
  //   totalDuration,
  //   runtime_length_min: (totalDuration / 60).toFixed(0)
  // })

  // TODO(daneroo) and neither is falsy
  const doAudible = false
  if (doAudible) {
    if (okAuthorTitle) {
      await sleep(1000)
      const author = metas[0].common.artist
      const title = metas[0].common.album
      const results = await searchAudible({ author, title })
      // console.log(JSON.stringify(data, null, 2))
      console.log(`Got ${results.products.length} results`)
      results.products.forEach(book => {
        const { asin, authors, narrators, runtime_length_min, series } = book
        console.log({
          asin,
          title,
          authors,
          narrators,
          runtime_length_min,
          series
        })
      })
    } else {
      console.log('skip audible')
    }
  }
}

async function validateUniqueAuthorTitle (metas, directoryPath) {
  if (metas.length == 0) {
    console.error(`${directoryPath} has ${metas.length} entries`)
    return true //??
  }

  const authorHint = getAuthor(directoryPath)
  const titleHint = getTitle(directoryPath)
  if (authorHint) {
    console.error('got author hint:', authorHint)
  }
  if (titleHint) {
    console.error('got title hint:', titleHint)
  }
  const dedupAuthor = authorHint
    ? [authorHint]
    : dedupArray(metas.map(m => m.common.artist))
  const dedupTitle = titleHint
    ? [titleHint]
    : dedupArray(metas.map(m => m.common.album))

  // dedup'd array is ok, if it has exactly one entry, which is not falsy: (null or empty)
  function isUniqueAndTruthy (dedupAry) {
    if (dedupAry.length > 1 || dedupAry.length == 0) return false
    // now we have a single entry
    const first = dedupAry[0]
    // might trim the value?
    if (!first) return false
    return true
  }
  const invalid =
    !isUniqueAndTruthy(dedupAuthor) || !isUniqueAndTruthy(dedupTitle)
  if (invalid) {
    console.error(`${directoryPath} needs author title hints`)
    console.log(`"${directoryPath}": {`)
    if (!isUniqueAndTruthy(dedupAuthor)) {
      console.log('// Non-unique Author:', JSON.stringify(dedupAuthor))
      console.log('author:"",')
    }
    if (!isUniqueAndTruthy(dedupTitle)) {
      console.log('// Non-unique Title: ', JSON.stringify(dedupTitle))
      console.log('title: "",')
    }
    console.log(`},`)
  }
  return false
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

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
