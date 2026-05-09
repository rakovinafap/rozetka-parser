const cheerio = require('cheerio')

function cleanHTML(html = '') {
  if (!html) return ''

  const $ = cheerio.load(html)

  let hasTrash = true

  while (hasTrash) {
    hasTrash = false

    $('div, section').each((_, el) => {
      const inner = $(el).html() || ''
      $(el).replaceWith(inner)
      hasTrash = true
    })
  }

  $('*').each((_, el) => {
    Object.keys(el.attribs || {}).forEach(attr => {
      $(el).removeAttr(attr)
    })
  })

  return $('body').html()?.trim() || ''
}

module.exports = { cleanHTML }