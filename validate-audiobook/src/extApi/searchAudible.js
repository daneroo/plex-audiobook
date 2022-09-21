// @ts-check
import { join } from 'path'
import { promises as fs } from 'fs'
const crypto = await import('node:crypto')
import fetch from 'node-fetch'

// see Unofficial docs for audible API
// https://audible.readthedocs.io/en/latest/misc/external_api.html#products

// Constants
// where we store the cached responses
const cacheDirectoryPath = join(process.cwd(), 'cache', 'audible')
// don't overwhelm audible's api server (10/s seems reasonable)
const delayForAudibleAPIms = 100

/**
 * @typedef {Object} AudibleBook - creates a new type named 'SpecialType'
 * @property {string} asin - audible asin identifier
 * @property {string[]} authors - an array of authors
 * @property {string} title - book title
 * @property {string} series - series title
 * @property {number} seriesPosition - position in series
 * @property {string[]} narrators - an array of narrators
 * @property {number=} duration - length of book in seconds (optional)
 */

/**
 * Sorts Audiblebooks by duration (in seconds)
 *   - The list is sorted with respect to a reference duration
 *   - if this reference duration is not defined, it is set to 0
 * This amounts to sorting a list of audible books by their distance (in duration) to a reference duration
 *
 * @param {AudibleBook[]} books - The books to sort
 * @param {number} [duration=0] - reference duration (defaults to 0)
 * @returns {AudibleBook[]} Return the sorted books
 */
export function sortAudibleBooks (books, duration = 0) {
  // console.error('Sorting around', { duration })
  //  we must be careful, as the duration is not always defined on incoming books (default to a large value in this case)
  const largeDuration = 1e7 // 115 days! - we use || because NaN is falsy, Nullish coalescing will not do.
  const sortedAudible = [...books].sort((b1, b2) => {
    const d1 = Math.abs((b1.duration || largeDuration) - duration)
    const d2 = Math.abs((b2.duration || largeDuration) - duration)
    return d1 - d2
  })
  return sortedAudible
}

/**
 *
 * @param {{ author: string, title: number }} opts - the parameters, required
 * @returns {Promise<AudibleBook[]>}
 */
export async function searchAudible ({ author, title }) {
  const AUDIBLE_ENDPOINT = 'https://api.audible.com/1.0/catalog/products'
  const urlHref = urlHrefForSearch({ author, title })
  // console.error('fetching (possibly cached)', urlHref)

  // check cache first
  const cachedResult = await getCachedResult(urlHref)
  const results = cachedResult ?? (await fetchResult(urlHref))

  // now massage and sort the results.
  const audibleBooks = results.products.map(audibleBook)

  return audibleBooks
}

/**
 *
 * @param {*} book
 * @returns {AudibleBook}
 */
// casts and renames fields for use as an AudibleBook
// TODO handle multiple series
function audibleBook (book) {
  const { asin, authors, title, narrators, series, runtime_length_min } = book

  return {
    asin,
    authors: authors.map(author => author?.name),
    title,
    series: series?.[0].title,
    seriesPosition: series?.[0].sequence,
    narrators: narrators?.map(author => author?.name),
    // this preserves null for duration, but we might want to omit the member altogether
    duration: runtime_length_min ? runtime_length_min * 60 : runtime_length_min
  }
}

async function fetchResult (urlHref) {
  // don't overwhelm audible's api server (10/s seems reasonable)
  await sleep(delayForAudibleAPIms)

  console.error('fetching (not cached)', urlHref)
  const response = await fetch(urlHref)
  const results = await response.json()

  // store cache results
  const cacheKeyPath = getCacheKeyPath(urlHref)
  await fs.mkdir(cacheDirectoryPath, { recursive: true })
  await storeJSON(results, cacheKeyPath)
  return results
}

async function getCachedResult (urlHref) {
  const cacheKeyPath = getCacheKeyPath(urlHref)
  return await readJSON(cacheKeyPath).catch(() => null)
}

function getCacheKeyPath (urlHref) {
  const cacheKey = sha256sum(urlHref)
  const cacheKeyPath = join(cacheDirectoryPath, `${cacheKey}.json`)
  return cacheKeyPath
}

/**
 * @param {{ author: string, title: number }} opts - The options
 * @returns {string} Return the URL.href
 */
function urlHrefForSearch ({ author, title }) {
  const AUDIBLE_ENDPOINT = 'https://api.audible.com/1.0/catalog/products'
  const url = new URL(AUDIBLE_ENDPOINT)
  const params = {
    response_groups:
      'contributors,product_attrs,product_desc,product_extended_attrs,series',
    // response_groups – [contributors, media, price, product_attrs, product_desc, product_extended_attrs, product_plan_details, product_plans, rating, review_attrs, reviews, sample, series, sku]
    num_results: 10,
    products_sort_by: 'Relevance',
    author,
    title
  }
  //  map params object to url's searchParams
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
  return url.href
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
