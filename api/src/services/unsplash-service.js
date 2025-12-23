const fetch = global.fetch || require('node-fetch')

module.exports = class UnsplashService {
  constructor(accessKey) {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY || accessKey || null
  }

  async searchImage(query) {
    if (!this.accessKey) throw new Error('UNSPLASH_ACCESS_KEY not configured')
    if (!query || !query.trim()) return null
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('per_page', '1')

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${this.accessKey}`
      }
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`Unsplash API error: ${res.status} ${txt}`)
    }

    const data = await res.json()
    if (!data || !Array.isArray(data.results) || !data.results.length) return null
    const item = data.results[0]
    return {
      id: item.id,
      url: item.urls?.small || item.urls?.regular || null,
      full: item.urls?.full || null,
      author: item.user?.name || item.user?.username || null,
      author_url: item.user?.links?.html || null,
      source: 'unsplash',
      raw: item
    }
  }
}
