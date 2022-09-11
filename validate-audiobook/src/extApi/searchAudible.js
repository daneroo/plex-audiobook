import fetch from 'node-fetch'

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

  console.log('fetching', url.href)
  const response = await fetch(url)
  const results = await response.json()
  return results
}
