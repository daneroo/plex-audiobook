// @ts-check
import { join } from 'path'
import { promises as fs } from 'fs'

const crypto = await import('node:crypto')

// There is an `xsd` schema for ffprobe output, might be a starting point for a type definition
// https://github.com/FFmpeg/FFmpeg/blob/master/doc/ffprobe.xsd

// Constants
// where we store the cached responses
const cacheDirectoryPath = join(process.cwd(), 'cache/ffprobe')

/**
 *
 * @param {{ string }} filePath - the parameters, required
 * @returns {Promise<Object>}
 */
export async function ffprobe (filePath) {
  // get absolute filepath
  const absoluteFilePath = filePath
  // console.error('probing (possibly cached)', absoluteFilePath)

  // check cache first
  const cachedResult = await getCachedResult(filePath)
  const results = cachedResult ?? (await fetchResult(filePath))

  // TODO: massage the results.
  // const audibleBooks = results.products.map(audibleBook)
  // return audibleBooks

  return results
}

async function fetchResult (filePath) {
  console.error('fetching (not cached)', filePath)
  // const response = await fetch(filePath)
  // const results = await response.json()
  try {
    const jsonString = await execDocker(filePath)
    if (!jsonString) {
      return null // and skip caching results
    }
    const results = JSON.parse(jsonString)
    // store cache results only if we have a result (no exception)
    const cacheKeyPath = getCacheKeyPath(filePath)
    await fs.mkdir(cacheDirectoryPath, { recursive: true })
    await storeJSON(results, cacheKeyPath)
    return results
  } catch (error) {
    console.error('fetchResult caught error', error)
    // console.error('fetchResult error', error)
  }
}

// docker run --rm --entrypoint '' -v "$(pwd)/$i":/audio/file:ro jrottenberg/ffmpeg:4.4-ubuntu bash -c 'ffprobe -of json -show_format -show_chapters /audio/file 2>/dev/null' | jq .format.duration; done

// execute a command in an ffmpeg docker container
// return JSON from stdout, console.error stderr, and catch and log exceptions
async function execDocker (filePath) {
  const image = 'jrottenberg/ffmpeg:4.4-ubuntu'

  //  no need t use bash -c '', because we can now ignore stderr
  // we swap ffmpeg for ffprobe as the entrypoint
  const command = `docker run --rm --entrypoint 'ffprobe' -v "${filePath}":/audio/file:ro ${image} -of json -show_format -show_chapters /audio/file`

  try {
    const { stdout, stderr } = await execCommand(command)
    if (stderr) {
      console.error('discarding execDocker stderr')
      // console.error('discarding execDocker stderr', stderr)
    }
    return stdout
  } catch (error) {
    // console.error('exec', error)
    console.error('dockerExec error', error)
    return null
  }
}

// Execute a command in a shell
// https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
//  Good examples for tests
// const results = { example: await execCommand('echo this is stdout') }
// const results = { example: await execCommand('echo this is stderr 1>&2') }
// const results = { example: await execCommand('uname -a') }
// const results = { example: await execCommand('false') } // exit code 1
// const results = {
//   example: await execCommand('docker run --rm ubuntu uname -a')
// }
async function execCommand (command) {
  const { exec: execWithCallback } = await import('node:child_process')
  const { promisify } = await import('node:util')
  // The promisified version of exec
  const exec = promisify(execWithCallback)
  return exec(command)
}

async function getCachedResult (filePath) {
  const cacheKeyPath = getCacheKeyPath(filePath)
  return await readJSON(cacheKeyPath).catch(() => null)
}

function getCacheKeyPath (filePath) {
  const cacheKey = sha256sum(filePath)
  const cacheKeyPath = join(cacheDirectoryPath, `${cacheKey}.json`)
  return cacheKeyPath
}

// The functions below are for caching results
function sha256sum (input) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
}

async function storeJSON (json, path) {
  const data = JSON.stringify(json, null, 2)
  await fs.writeFile(path, data)
  // console.error('Wrote', path)
  return path
}

async function readJSON (path) {
  const data = await fs.readFile(path)
  const json = JSON.parse(data.toString())
  return json
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
