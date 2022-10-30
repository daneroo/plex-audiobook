import { promises as fs } from 'fs'
import path from 'path'
// import crypto from 'node:crypto'

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { parseFile } from 'music-metadata'
import * as ffmeta from 'ffmeta' // this is just to serialize ffmpeg's metadata in it's custom format

// Internal
import {
  getDirectories,
  getFiles,
  filterAudioFileExtensions,
  filterNonAudioExtensionsOrNames,
} from './traverse/module.js'
import { ffprobe, execCommand } from './extApi/module.js'
import { getAuthor, getTitle, getSkip } from './hints/authorTitle.js'
import { formatElapsed } from './time/module.js'

const defaultRootPath =
  '/Volumes/Space/archive/media/audiobooks/Steven Brust - Khaavren Romances/'
// '/Volumes/Space/archive/media/audiobooks/Adam Becker - What Is Real'
const TMPDIR = 'convert/tmpdir'
const OUTPUT_DIR = 'convert/converted'

await main()

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('rootPath', {
      alias: 'r',
      type: 'string',
      demandOption: true,
      default: defaultRootPath,
      describe: 'Path of the root directory to search from',
    })
    .parseAsync()
  // destructure arguments
  const { rootPath: unverifiedRootPath } = argv
  // clean the root path by removing trailing slash
  const rootPath = unverifiedRootPath.replace(/\/$/, '')
  // could check if path exists

  const startMs = +new Date()
  const directories = await getDirectories(rootPath)
  console.error(
    `Got ${directories.length} directories in`,
    formatElapsed(startMs)
  )

  // per directory conversion
  for (const directoryPath of directories) {
    // const bookData = await convertDirectory(directoryPath)
    await convertDirectory(directoryPath)
  }
  // console.error('Done in', formatElapsed(startMs))
}

// export a data structure for the directory
async function convertDirectory(directoryPath) {
  console.error('=-=-: Convert', directoryPath.substring(39))
  await fs.mkdir(TMPDIR, { recursive: true })

  const filenames = await getFiles(directoryPath)
  const audioFiles = filenames.filter(filterAudioFileExtensions)

  if (audioFiles.length == 0) {
    console.error('no audio files')
    return
  }

  // just show for now - do not actually skip
  const skipHint = getSkip(directoryPath)
  if (skipHint) {
    console.error(`skipHint: ${skipHint}`)
    // return
  }

  console.error(`converting ${audioFiles.length} audio files`)

  // write listing.txt - writeFile takes an iterable (our mapped array in this case)
  await fs.writeFile(
    path.join(TMPDIR, 'listing.txt'),
    audioFiles.map((f) => {
      // https://ffmpeg.org/ffmpeg-utils.html#Examples
      // to escape a single quote: ' => '\''
      const escaped = f.replace(/'/g, "'\\''")
      return `file '${escaped}'\n`
    })
  )

  const metas = await getMetadataForMultipleFiles(audioFiles)

  // write cover.jpg
  // get cover from first audio file
  if (!metas[0].common.picture?.[0]) {
    console.error('no cover found in first audio file')
    return
  }
  const picture = metas[0].common.picture?.[0]
  // might not be a jpeg file.. could be gif or png
  //  in that case just change the suffix, ffmpeg will read those as well,
  //  in fact it may well detect the mime type from the file content rather that the suffix
  if (picture.format !== 'image/jpeg') {
    console.error('cover image is not a jpeg file:', picture.format)
    return
  }
  const cover = metas[0].common.picture?.[0].data
  await fs.writeFile(path.join(TMPDIR, 'cover.jpg'), cover)

  // console.error(
  //   '******',
  //   JSON.stringify(
  //     metas[0],
  //     (key, value) => {
  //       if (key === 'data' && Array.isArray(value)) return '[removed]'
  //       if (key === 'warnings' && Array.isArray(value)) return '[removed]'
  //       return value
  //     },
  //     2
  //   )
  // )

  const author = getAuthor(directoryPath)
  const title = getTitle(directoryPath)

  // chapters
  const chapters = chaptersFromMetas(metas)
  // console.error(JSON.stringify(chapters, null, 2))

  // write the meta data in ffmetadata format
  const metadata = { artist: author, title }
  await fs.writeFile(
    path.join(TMPDIR, 'ffmetadata.txt'),
    ffmeta.stringify({ metadata, streams: [], chapters })
  )

  const startMs = +new Date()
  await convert()
  console.error('Converted in', formatElapsed(startMs))
  await move()
}

async function move() {
  // move the file to the output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const from = path.join(TMPDIR, 'output.mp3')
  const meta = await getMetadataForSingleFile(from, {})
  const author = meta.common.artist
  const title = meta.common.title
  const to = path.join(OUTPUT_DIR, `${author} - ${title}.mp3`)
  console.error(`Renaming to ${to}`)
  await fs.rename(from, to)
}
// All in one step!
// time ffmpeg -v quiet -f concat -safe 0 -i listing.txt -i cover.jpg -i ffmetadata.txt -map_metadata 2 -map 0:0 -map 1:0 -c copy output.mp3
// re-extract metadata from produced file
// ffmpeg -v quiet -i output.mp3 -f ffmetadata -
// same with
// ffprobe -v quiet -print_format json -show_format -show_chapters output.mp3
async function convert() {
  // -y is for allowing overwrite of output.mp3
  // -v quiet is for suppressing ffmpeg output
  // -safe 0 allows unsafe filenames (e.g. with spaces)
  const command = `cd "${TMPDIR}" && ffmpeg -v quiet -y -f concat -safe 0 -i listing.txt -i cover.jpg -i ffmetadata.txt -map_metadata 2 -map 0:0 -map 1:0 -c copy output.mp3`
  console.error('convert command\n', command)

  try {
    const { stdout, stderr } = await execCommand(command)
    if (stderr) {
      console.error('convert stderr', stderr)
    }
    if (stdout) {
      console.error('convert stdout', stdout)
    }
    return stdout
  } catch (error) {
    // console.error('exec', error)
    console.error('convert error', error)
    return null
  }
}
// extract common.title and format.duration from metas
// and map to expected format for ffmeta.stringify
function chaptersFromMetas(metas) {
  let startMillis = 0

  return metas.map((m) => {
    const durationMillis = m.format.duration * 1000
    const endMillis = startMillis + durationMillis
    const result = {
      TIMEBASE: '1/1000',
      START: startMillis.toFixed(0),
      END: endMillis.toFixed(0),
      metadata: {
        title: m.common.title,
      },
    }
    startMillis = endMillis
    return result
  })
}
// get metadata for a collection of audio files (typically a directory)
async function getMetadataForMultipleFiles(
  audioFiles,
  options = {
    duration: false, // much slower when true even for some .mp3
    includeChapters: false,
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
async function getMetadataForSingleFile(filePath, options) {
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
}
