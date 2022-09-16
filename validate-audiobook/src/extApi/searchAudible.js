import { join } from 'path'
import { promises as fs } from 'fs'
const crypto = await import('node:crypto')
import fetch from 'node-fetch'

// see Unofficial docs:
// https://audible.readthedocs.io/en/latest/misc/external_api.html#products
export async function searchAudible ({ author, title }) {
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

  const cacheDirectoryPath = join(process.cwd(), 'cache')
  await fs.mkdir(cacheDirectoryPath, { recursive: true })
  const cacheKey = sha256sum(url.href)
  const cacheKeyPath = join(cacheDirectoryPath, `${cacheKey}.json`)
  // check cache first
  const cachedResult = await readJSON(cacheKeyPath).catch(() => null)
  if (cachedResult) {
    console.error('Using cached result for', url.href)
    return cachedResult
  }

  // don't overwhelm audible's api server (10/s seems reasonable)
  await sleep(100)

  // console.error('fetching', url.href)
  const response = await fetch(url)
  const results = await response.json()

  // store cache results
  await storeJSON(results, cacheKeyPath)

  return results
}

function sha256sum (input) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
}

async function storeJSON (json, path) {
  const data = JSON.stringify(json, null, 2)
  await fs.writeFile(path, data)
  console.error('Wrote', path)
  return path
}

async function readJSON (path) {
  const data = await fs.readFile(path)
  const json = JSON.parse(data)
  return json
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
