import path from 'path'
import Walk from '@root/walk'
import { parseFile } from 'music-metadata'
// import inspect from 'object-inspect'

const rootPath = '/Volumes/Space/archive/media/audiobooks/'
await main(rootPath)

async function main (aPath) {
  const startMs = +new Date()
  await Walk.walk(aPath, async (err, pathname, dirent) => {
    if (err) {
      // throw an error to stop walking
      // (or return to ignore and keep going)
      console.warn('fs stat error for %s: %s', pathname, err.message)
      return
    }

    // return false to skip a directory
    // (ex: skipping "dot files")
    // if (dirent.isDirectory() && dirent.name.startsWith('.')) {
    //   return false
    // }
    if (dirent.isDirectory()) {
      console.log('=-=-:', pathname)
    } else if (dirent.isFile()) {
      console.log('  processing', dirent.name)
      await getMeta(pathname)
    } else {
      // dirent.isSymbolicLink(), etc...
      console.log('  skipping', dirent.name)
    }
  })
  console.error('Done in', formatElapsed(startMs))
}

async function getMeta (filePath) {
  // get metadata
  if (excludeKnownNonAudioFiles(filePath)) {
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

    const { codec, container } = metadata.format
    const { artist, artists, album } = metadata.common
    console.log(JSON.stringify({ codec, container, artist, artists, album }))
    // console.error(formatElapsed(start), path.basename(filePath))
  } catch (error) {
    console.error(
      formatElapsed(startMs),
      path.extname(filePath),
      error.message,
      path.basename(filePath)
    )
  }
}

function excludeKnownNonAudioFiles (filePath) {
  const ext = path.extname(filePath)
  const excludedFilenames = ['.DS_Store', 'MD5SUM']
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
  if (
    excludedExtensions.includes(path.extname(filePath)) ||
    excludedFilenames.includes(path.basename(filePath)) // extension is complete basename (e.g. .DS_Store)
  ) {
    // console.error('x.xxxs', ext, path.basename(filePath))
    return true
  }
  return false
}

function formatElapsed (startMs) {
  const elapsedSeconds = ((+new Date() - startMs) / 1000).toFixed(3)
  return elapsedSeconds + 's'
}
