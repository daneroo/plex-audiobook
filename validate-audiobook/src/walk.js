import path from 'path'
import { parseFile } from 'music-metadata'
import { getDirectories, getFiles } from './traverse/module.js'
// import inspect from 'object-inspect'

const rootPath = '/Volumes/Space/archive/media/audiobooks/'
await main(rootPath)

async function main (aPath) {
  const startMs = +new Date()
  const directories = await getDirectories(aPath)
  console.error(
    `Got ${directories.length} directories in`,
    formatElapsed(startMs)
  )

  const allFiles = await getFiles(aPath, { recurse: true })
  console.error(`Got ${allFiles.length} files in`, formatElapsed(startMs))
  verifyExtensionsAllAccountedFor(allFiles)

  for (const directoryPath of directories) {
    await classifyDirectory(directoryPath)
  }
  console.error('Done in', formatElapsed(startMs))
}

async function classifyDirectory (directoryPath) {
  console.error('=-=-:', directoryPath.substring(40))
  const filenames = await getFiles(directoryPath)

  // just console.error's exceptions
  verifyExtensionsAllAccountedFor(filenames)

  const audioFiles = filenames.filter(filterAudioFileExtensions)

  const metadatas = []
  for (const filename of audioFiles) {
    // console.error('  processing', filename)
    const metadata = await getMeta(filename)
    // const { codec, container } = metadata.format
    // const { artist, artists, album } = metadata.common
    // console.log('  - ', JSON.stringify({ artist, album }))
    metadatas.push(metadata)
  }
  isUnique(
    metadatas.map(m => m.common.artist),
    'artist'
  )
  isUnique(
    metadatas.map(m => m.common.album),
    'album'
  )
}

function isUnique (ary, label = 'attribute') {
  const dedup = [...new Set(ary)]
  if (dedup.length > 1) {
    console.log(`Non-unique ${label}: ${dedup}`)
  }
  return dedup.length == 1
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

async function getMeta (filePath) {
  // get metadata
  if (filterNonAudioExtensionsOrNames(filePath)) {
    return
  }
  const startMs = +new Date()
  try {
    const metadata = await parseFile(filePath, {
      duration: false, // much slower when true even for some .mp3
      includeChapters: false
    })
    // console.log(inspect(metadata, { showHidden: false, depth: null }))
    // console.log(inspect(metadata.common, { showHidden: true, depth: null }))

    // const { codec, container } = metadata.format
    // const { artist, artists, album } = metadata.common
    // console.log(JSON.stringify({ codec, container, artist, artists, album }))
    // console.error(formatElapsed(start), path.basename(filePath))
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

function filterAudioFileExtensions (filePath) {
  const includedExtensions = ['.mp3', '.m4b', '.m4a']
  return includedExtensions.includes(path.extname(filePath))
}

function filterNonAudioExtensionsOrNames (filePath) {
  return (
    filterNonAudioFileExtensions(filePath) || filterNonAudioFilenames(filePath)
  )
}

function filterNonAudioFileExtensions (filePath) {
  const excludedExtensions = [
    '.jpeg',
    '.jpg',
    '.JPG',
    '.gif',
    '.png',
    '.pdf',
    '.cue',
    '.epub',
    '.txt',
    '.nfo',
    '.mobi',
    '.m3u',
    '.rtf'
  ]
  const ext = path.extname(filePath)
  return excludedExtensions.includes(ext)
}

function filterNonAudioFilenames (filePath) {
  const excludedFilenames = ['.DS_Store', 'MD5SUM']
  return excludedFilenames.includes(path.basename(filePath))
}

function formatElapsed (startMs) {
  const elapsedSeconds = ((+new Date() - startMs) / 1000).toFixed(3)
  return elapsedSeconds + 's'
}
