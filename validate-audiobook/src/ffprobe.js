import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
// Internal
import {
  getDirectories,
  getFiles,
  filterAudioFileExtensions,
} from './traverse/module.js'
import { ffprobe } from './extApi/module.js'
import { formatElapsed } from './time/module.js'

const defaultRootPath = '/Volumes/Space/archive/media/audiobooks'

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
  const allFiles = await getFiles(rootPath, { recurse: true })
  const audioFiles = allFiles.filter(filterAudioFileExtensions)

  console.error(`Got ${allFiles.length} audio files in`, formatElapsed(startMs))

  for (const filename of audioFiles) {
    // ffprobe fallback for duration
    const startMs = +new Date()
    // const ffprobeMeta = await ffprobe(filename)
    await ffprobe(filename)
    console.error('ffprobe', formatElapsed(startMs), filename)
  }

  const directories = await getDirectories(rootPath)
  console.error(
    `Got ${directories.length} directories in`,
    formatElapsed(startMs)
  )
}
