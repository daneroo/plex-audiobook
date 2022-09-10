import path from 'path'
import Walk from '@root/walk'
import { parseFile } from 'music-metadata'
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

  for (const directoryPath of directories) {
    await classifyDirectory(directoryPath)
  }
  console.error('Done in', formatElapsed(startMs))
}

async function classifyDirectory (directoryPath) {
  // console.error('=-=-:', directoryPath)
  const filenames = await getDirectChildren(directoryPath)

  // just console.error's exceptions
  verifyExtensionsAllAccountedFor(filenames)

  const audioFiles = filenames.filter(filterKnownAudioFileExtensions)

  for (const filename of filenames) {
    console.error('  processing', filename)
    await getMeta(filename)
  }
}

// for filenames in a directory, verify that all extensions (and some known filenames are accounted for)
// simply console.error the exception files.
function verifyExtensionsAllAccountedFor (filenames) {
  const excludedFilenames = filenames.filter(filterKnownNonAudioFileExtensions)

  const audioFiles = filenames.filter(filterKnownAudioFileExtensions)

  // make sure all extensions are known, or known to be excluded
  if (audioFiles.length + excludedFilenames.length !== filenames.length) {
    const unclassified = filenames.filter(filePath => {
      if (filterKnownAudioFileExtensions(filePath)) return false
      if (filterKnownNonAudioFileExtensions(filePath)) return false
      return true
    })
    console.error(
      `  Got ${audioFiles.length} audio files ${excludedFilenames.length} excluded files and ${unclassified.length} unclassified files`
    )
    console.error(JSON.stringify(unclassified, null, 2))
    return false
  }
  return true
}
async function getDirectChildren (rootPath) {
  const pathnames = []
  await Walk.walk(rootPath, async (err, pathname, dirent) => {
    if (err) {
      // throw an error to stop walking (or return to ignore and keep going)
      console.warn('fs stat error for %s: %s', pathname, err.message)
      return
    }
    if (rootPath === pathname) {
      return true
    }
    if (dirent.isDirectory()) {
      // we only want direct children, no nested directories
      // but we doo need to descend/recurse into the rootPath itself
      return rootPath === pathname
    } else if (dirent.isFile()) {
      pathnames.push(pathname)
    } else {
      // dirent.isSymbolicLink(), etc...
      // console.error('  skipping', dirent.name)
    }
  })
  return pathnames
}

async function getDirectories (rootPath) {
  const directories = []
  await Walk.walk(rootPath, async (err, pathname, dirent) => {
    if (err) {
      // throw an error to stop walking (or return to ignore and keep going)
      console.warn('fs stat error for %s: %s', pathname, err.message)
      return
    }
    if (dirent.isDirectory()) {
      directories.push(pathname)
    }
  })
  return directories
}

async function getMeta (filePath) {
  // get metadata
  if (filterKnownNonAudioFileExtensions(filePath)) {
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

function filterKnownAudioFileExtensions (filePath) {
  const ext = path.extname(filePath)
  const includedExtensions = ['.mp3', '.m4b', '.m4a']
  return includedExtensions.includes(path.extname(filePath))
}
function filterKnownNonAudioFileExtensions (filePath) {
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
