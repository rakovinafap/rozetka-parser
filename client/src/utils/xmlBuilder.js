export function formatXML(xml) {
  const PADDING = '  '
  const reg = /(>)(<)(\/)?/g

  xml = xml.replace(reg, '$1\n$2$3')

  let pad = 0

  return xml
  .split('\n')
  .map((line) => {
    line = line.trim()
    if (!line) return ''

    // безопасное уменьшение
    if (line.match(/^<\/\w/)) {
      pad = Math.max(pad - 1, 0)
    }

    const indent = PADDING.repeat(Math.max(pad, 0))

    // увеличение
    if (line.match(/^<\w[^>]*[^/]>$/)) {
      pad++
    }

    return indent + line
  })
  .join('\n')
}


export function buildXML(data, settings, showHeader = true) {
  if (!data) return ''

  const { offerId, textOfferId, addIdToName, stockQuantity, categories = [], customParams = [] } = settings

  let testCategiry = ''
  if (data.category === 'Тестова категорія') {
    testCategiry = '<category id="1">Тестова категорія</category>'
  }

  const cleanPrice = data.price?.replace(/\D/g, '') || ''

  const escapeXml = (str = '') =>
    str.replace(/[<>&'"]/g, c => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    }[c]))

// Об'єднуємо спарсені параметри з кастомними
  const allParams = [
    ...(data?.params || []),
    ...(customParams || [])
  ]
  
 

  // Будуємо список категорій
  const categoriesXML = categories.map(cat => 
    `  <category id="${cat.id}">${escapeXml(cat.name)}</category>`
  ).join('\n')
  
  // Знаходимо ID категорії товара
  const category = categories.find(
    c => c.name.toLowerCase() === data.category?.toLowerCase().trim()
  )
  const categoryId = category?.id || '1'
    
  // Шапка
  const shopHeader = `
  <?xml version="1.0" encoding="UTF-8"?>
  <yml_catalog date="2022-07-20 14:58">
  <shop>
    <name>Название магазина</name>
    <company>ТОВ "Название компании"</company>
    <url>Ваш сайт</url>
    <currencies>
      <currency id="UAH" rate="1"/>
      <currency id="USD" rate="41.2"/>
      <currency id="EUR" rate="45.8"/>
    </currencies>`

  const offers = `<offers>`

  const shopFooter = `
  </offers>
  </shop>
  </yml_catalog>`  

  const xmlHeader = showHeader ? shopHeader : ''
  const xmlOffers = showHeader ? offers : ''
  const xmlFooter = showHeader ? shopFooter : ''

  const rawXML = 
`${xmlHeader}
<categories>
${testCategiry || categoriesXML}
</categories>
${xmlOffers || ''}
<offer id="${textOfferId}${offerId}" available="true">
<price>${cleanPrice}</price>
<currencyId>UAH</currencyId>
<categoryId>${categoryId}</categoryId>
${data?.images
  ?.map(i => `<picture>\n${escapeXml(i)}\n</picture>`)
  .join('\n')}
<delivery>true</delivery>
<stock_quantity>${stockQuantity}</stock_quantity>
<name>${escapeXml(data.title)}${addIdToName ? ` ${textOfferId}${offerId}` : ''}</name>
<vendor>${escapeXml(data.vendor || 'test')}</vendor>
<description><![CDATA[${data.description || ''}]]></description>
${allParams?.map(p => `        <param name="${escapeXml(p.label)}">${escapeXml(p.value)}</param>`).join('\n')}
</offer>
${xmlFooter}`


  return formatXML(rawXML)
}