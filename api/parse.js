const axios = require('axios')
const cheerio = require('cheerio')
const { cleanHTML } = require('./utils/cleanHTML')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
      }
    })

    const $ = cheerio.load(data)

    const title = $('h1').first().text().trim()
    const price = $('.product-price__big').first().text().trim().slice(0, -1)
    const oldPrice = $('.product-price__small').first().text().trim()

    const category = $('[data-testid="crumb_item"]')
      .eq(-2)
      .text()
      .replace(/\//g, '')
      .trim()

    let vendor = ''
    const producerBlock = $('rz-product-producer').first()

    if (producerBlock.length) {
      vendor = producerBlock.find('strong').text().trim()

      if (!vendor) {
        const fullText = producerBlock.text()
        const match = fullText.match(/Усі товари бренду\s+(.+?)(?:\s*$|\.)/)
        vendor = match ? match[1].trim() : ''
      }
    }

    let rawDescription = ''
    const descriptionBlock = $('#description')

    if (descriptionBlock.length) {
      descriptionBlock.find('button, .stickytop, h2, .product-wrapper__left, rzstickytop').remove()

      let rawHtml =
        descriptionBlock.find('.product-wrapper__right').html() ||
        descriptionBlock.html()

      rawHtml = rawHtml
        .replace(/<rz-text-content[^>]*>/g, '')
        .replace(/<\/rz-text-content>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^<!---->/, '')
        .replace(/<!---->$/, '')

      rawDescription = rawHtml
    }

    const description = rawDescription
      ? cleanHTML(rawDescription)
      : 'Опис відсутній'

    const images = []

    $('.thumbnail-button__picture').each((i, el) => {
      const src = $(el).attr('src')

      if (
        src &&
        !src.includes('placeholder') &&
        !src.startsWith('data:')
      ) {
        images.push(src.replace('/medium/', '/original/'))
      }
    })

    const params = []

    $('.group .item').each((i, el) => {
      const label = $(el).find('dt.label').text().trim()

      let values = []

      $(el)
        .find('dd.value li')
        .each((_, li) => {
          const text = $(li).text().trim()
          if (text) values.push(text)
        })

      if (!values.length) {
        const raw = $(el).find('dd.value').text().trim()
        if (raw) values.push(raw)
      }

      if (label && values.length) {
        params.push({
          label,
          value: values.join(', ')
        })
      }
    })

    return res.json({
      title,
      price,
      oldPrice,
      category,
      description,
      images,
      params,
      vendor
    })
  } catch (e) {
    console.log('ERROR:', e.message)
    return res.status(500).json({ error: e.message })
  }
}