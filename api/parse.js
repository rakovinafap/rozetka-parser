const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const cors = require('cors')
const nodemailer = require('nodemailer')
const app = express()



/* require('dotenv').config() */

app.use(cors())
app.use(express.json())

app.get('/test', (req, res) => {
  res.json({ ok: true })
})

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

