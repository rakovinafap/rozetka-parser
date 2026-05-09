/* const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const cors = require('cors')
const nodemailer = require('nodemailer')
const app = express()

require('dotenv').config()

app.use(cors())
app.use(express.json())

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})
  

function cleanHTML(html = '') {
  if (!html) return ''

  const $ = require('cheerio').load(html)

  // 🔥 крутим пока есть мусорные теги
  let hasTrash = true

  while (hasTrash) {
    hasTrash = false

    $('div, section').each((_, el) => {
      const inner = $(el).html() || ''
      $(el).replaceWith(inner)
      hasTrash = true
    })
  }

  // удаляем атрибуты
  $('*').each((_, el) => {
    Object.keys(el.attribs || {}).forEach(attr => {
      $(el).removeAttr(attr)
    })
  })

  return $('body').html()?.trim() || ''
}

app.post('/parse', async (req, res) => {
    console.log('POST HIT')
  try {
    const { url } = req.body
    console.log('URL:', url)
    const { data } = await axios.get(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
    }
    })

    const $ = cheerio.load(data)

    const title = $('h1').first().text().trim()
    const price = $('.product-price__big').first().text().trim().slice(0, -1)
    const oldPrice = $('.product-price__small').first().text().trim()

    const category = $('[data-testid="crumb_item"]')
    .eq(-2)  // передостанній
    .text()
    .replace(/\//g, '')
    .trim()

    // Знаходимо блок rz-product-producer
    const producerBlock = $('rz-product-producer').first()

    // Витягуємо текст strong або просто весь текст
    let vendor = ''
    if (producerBlock.length) {
      // Спосіб 1: через strong
      vendor = producerBlock.find('strong').text().trim()
      
      // Спосіб 2: якщо strong порожній, витягуємо з тексту
      if (!vendor) {
        const fullText = producerBlock.text()
        const match = fullText.match(/Усі товари бренду\s+(.+?)(?:\s*$|\.)/)
        vendor = match ? match[1].trim() : ''
      }
    }

  
    // Найпростіший спосіб - взяти весь текст з блоку опису
    let rawDescription = ''
    const descriptionBlock = $('#description')
    if (descriptionBlock.length) {
      // Видаляємо зайві блоки (кнопки, навігацію)
      descriptionBlock.find('button, .stickytop, h2, .product-wrapper__left, rzstickytop').remove()
      
      // Отримуємо чистий HTML
      let rawHtml = descriptionBlock.find('.product-wrapper__right').html() || descriptionBlock.html()
      
      // Видаляємо теги rz-text-content та їх атрибути
      rawHtml = rawHtml.replace(/<rz-text-content[^>]*>/g, '')
      rawHtml = rawHtml.replace(/<\/rz-text-content>/g, '')
      
      // Видаляємо коментарі <!-- -->
      rawHtml = rawHtml.replace(/<!--[\s\S]*?-->/g, '')
      
      // Видаляємо зайві обгортки
      rawHtml = rawHtml.replace(/^<!---->/, '')
      rawHtml = rawHtml.replace(/<!---->$/, '')
      
      rawDescription = rawHtml
    }

    const description = rawDescription ? cleanHTML(rawDescription) : 'Опис відсутній'
    

    const images = []

// Спосіб 1: Через thumbnail-button__picture (як у вашому DOM)
$('.thumbnail-button__picture').each((i, el) => {
  const src = $(el).attr('src')
  
  if (src && 
      !src.includes('placeholder') && 
      !src.includes('1x1') && 
      !src.includes('spacer') &&
      !src.startsWith('data:')) {
    
    // Замінюємо 'medium' на 'original' або 'large' для більшого розміру
    let highResSrc = src.replace('/medium/', '/original/')
    
    images.push(highResSrc)
  }
})

    const params = []

    $('.group .item').each((i, el) => {
      const label = $(el).find('dt.label').text().trim()

      let values = []

      // если есть ссылки
      $(el).find('dd.value li').each((i, li) => {
        const text = $(li).text().trim()
        if (text) values.push(text)
      })

      // если просто span (без li)
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

    res.json({
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
    res.status(500).json({ error: e.message })
    }
})

app.post('/contact', async (req, res) => {
  try {
    const { email, message } = req.body

    if (!message?.trim()) {
      return res.status(400).json({
        error: 'Повідомлення порожнє'
      })
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Нове повідомлення з сайту Rozetka Parser',
      text: `
      Email користувача: ${email || 'не вказано'}

      Повідомлення:
      ${message}
            `
          })

          res.json({
            success: true
          })

        } catch (e) {
          console.log(e)

          res.status(500).json({
            error: 'Помилка відправки'
          })
    }
})

const serverless = require('serverless-http')

module.exports = serverless(app)

 */

/* module.exports = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'VERCEL API WORKS'
  })
} */
const axios = require('axios')
const cheerio = require('cheerio')

module.exports = async (req, res) => {
  try {
    console.log('METHOD:', req.method)
    console.log('RAW BODY:', req.body)

    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed'
      })
    }

    // =========================
    // SAFE BODY PARSING
    // =========================
    let body = req.body

    if (!body) body = {}

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid JSON body'
        })
      }
    }

    const url = body.url

    console.log('PARSED URL:', url)

    if (!url) {
      return res.status(400).json({
        error: 'No URL provided'
      })
    }

    // =========================
    // REQUEST TO ROZETKA
    // =========================
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
      }
    })

    const $ = cheerio.load(data)

    // =========================
    // MAIN FIELDS
    // =========================
    const title = $('h1').first().text().trim()

    const price = $('.product-price__big')
      .first()
      .text()
      .trim()
      .slice(0, -1)

    const oldPrice = $('.product-price__small')
      .first()
      .text()
      .trim()

    const category = $('[data-testid="crumb_item"]')
      .eq(-2)
      .text()
      .replace(/\//g, '')
      .trim()

    // =========================
    // VENDOR
    // =========================
    const producerBlock = $('rz-product-producer').first()

    let vendor = ''

    if (producerBlock.length) {
      vendor = producerBlock.find('strong').text().trim()

      if (!vendor) {
        const fullText = producerBlock.text()
        const match = fullText.match(/Усі товари бренду\s+(.+?)(?:\s*$|\.)/)
        vendor = match ? match[1].trim() : ''
      }
    }

    // =========================
    // IMAGES
    // =========================
    const images = []

    $('.thumbnail-button__picture').each((_, el) => {
      const src = $(el).attr('src')

      if (
        src &&
        !src.includes('placeholder') &&
        !src.includes('1x1') &&
        !src.startsWith('data:')
      ) {
        images.push(src.replace('/medium/', '/original/'))
      }
    })

    // =========================
    // PARAMETERS
    // =========================
    const params = []

    $('.group .item').each((_, el) => {
      const label = $(el).find('dt.label').text().trim()

      let values = []

      $(el).find('dd.value li').each((_, li) => {
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

    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      title,
      price,
      oldPrice,
      category,
      vendor,
      images,
      params
    })

  } catch (e) {
    console.log('ERROR:', e.message)

    return res.status(500).json({
      error: e.message
    })
  }
}