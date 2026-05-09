import { useState } from 'react'
import { buildXML } from './utils/xmlBuilder'
import { defaultData } from './/utils/defaultData'
import Footer from './Footer'
import { loadSettings, updateSettingsField, resetSettings, 
         addCategory, clearCategories, addCustomParam, removeCustomParam, 
         updateCustomParam } from './utils/settingsManager'

import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

import './App.css'

export default function App() {
  const [url, setUrl] = useState('')
  const [data, setData] = useState(defaultData)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null) // Стан для вибраного зображення
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)


   // Функція оновлення налаштувань
  const updateSettings = (key, value) => {
    const newSettings = updateSettingsField(settings, key, value)
    setSettings(newSettings)
  }
  
  
  // Скидання всіх налаштувань
  const handleResetAllSettings = () => {
    const newSettings = resetSettings()
    setSettings(newSettings)
  }

  const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(xml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  } catch (err) {
    console.error('Помилка копіювання:', err)
  }
}

const fetchData = async () => {
  if (!url.trim()) {
    alert('Введіть URL товару')
    return
  }

  setLoading(true)
  
  const nextId = String(Number(settings.offerId) + 1)
  
  try {
    const res = await fetch('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    const json = await res.json()
    
    if (json.error) {
      alert(`Помилка сервера: ${json.error}`)
      return
    }
    
    setData(json)
    
    // Оновлюємо ID
    let newSettings = updateSettingsField(settings, 'offerId', nextId)
    
    // Додаємо категорію якщо є
    if (json.category) {
      newSettings = addCategory(newSettings, json.category)
    }
    
    setSettings(newSettings)
    
  } catch (error) {
    console.error('❌ Деталі помилки:', error)
    alert(`Сталася помилка при парсингу: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

const xml = buildXML(data, settings, settings.showXmlHeader)

  // Функція для відкриття поп-апу
  const openImagePopup = (src) => {
    setSelectedImage(src)
  }

  // Функція для закриття поп-апу
  const closeImagePopup = () => {
    setSelectedImage(null)
  }

  return (
    <div className="app">
      <h2>Rozetka Parser</h2>
      <div className="input-row">
  <input
    className="input"
    value={url}
    onChange={e => setUrl(e.target.value)}
    placeholder="Введіть URL товару з Rozetka"
  />
  <button className="button" onClick={fetchData} disabled={loading}>
    {loading ? 'Парсинг...' : 'Парсити'}
  </button>
  
  {/* Шестеренка поруч з кнопкою */}
  <button 
    className="settings-gear-btn"
    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
    title={isSettingsOpen ? 'Згорнути налаштування' : 'Розгорнути налаштування'}
  >
    ⚙️
  </button>
</div>

{/* Блок налаштувань - з'являється під інпутом */}
{isSettingsOpen && (
  <div className="settings-dropdown">
    <div className="settings-dropdown-header">
      <h4>Налаштування XML</h4>
      <button 
        className="close-settings-btn"
        onClick={() => setIsSettingsOpen(false)}
      >
        ✕
      </button>
    </div>
    
    <div className="settings-dropdown-content">
      <div className="setting-row">
        <label>ID товару:</label>
        <input
          type="text"
          className="settings-input small"
          value={settings.textOfferId}
          onChange={(e) => updateSettings('textOfferId', e.target.value)}
          placeholder="префікс"
        />
        <input
          type="number"
          className="settings-input tiny"
          value={settings.offerId}
          onChange={(e) => updateSettings('offerId', e.target.value)}
          placeholder="число"
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.addIdToName}
            onChange={(e) => updateSettings('addIdToName', e.target.checked)}
          />
          <span>додавати ID до назви</span>
        </label>
      </div>

      <div className="setting-row">
        <label className="checkbox-label">Кількість на складі:</label>
        <input
          type="number"
          className="settings-input tiny"
          value={settings.stockQuantity}
          onChange={(e) => updateSettings('stockQuantity', e.target.value)}
          placeholder="склад"
        />
        </div>

      <div className="setting-row">
        <label>Категорії в XML:</label>
        <span className="categories-count">{settings.categories?.length || 0}</span>
        <button 
          className="button-small clear-categories-btn"
          onClick={() => {
            if (window.confirm('Ви впевнені, що хочете очистити всі категорії?')) {
              const newSettings = clearCategories(settings)
              setSettings(newSettings)
            }
          }}
        >
          🗑️ Очистити
        </button>
        
      </div>
      <div className="setting-row">
        <label>Показувати шапку XML:</label>
        <button 
          className="button-small"
          onClick={() => updateSettings('showXmlHeader', !settings.showXmlHeader)}
          title={settings.showXmlHeader ? 'Прибрати шапку' : 'Показати шапку'}
        >
          {settings.showXmlHeader ? '📄' : '🚫'} Шапка
        </button>
      </div>

      <div className="setting-row">
        <label>Кастомні параметри:</label>
        <button 
          className="button-small"
          onClick={() => {
            const newSettings = addCustomParam(settings, { label: '', value: '' })
            setSettings(newSettings)
          }}
        >
          + Додати
        </button>
        <button 
          className="button-small reset-settings-btn"
          onClick={handleResetAllSettings}
          title="Скинути всі налаштування"
        >
          🔄 Скинути
        </button>
      </div>

      {settings.customParams?.map((param, index) => (
        <div key={index} className="custom-param-row">
          <input
            type="text"
            className="settings-input"
            placeholder="Назва"
            value={param.label}
            onChange={(e) => {
              const newSettings = updateCustomParam(settings, index, 'label', e.target.value)
              setSettings(newSettings)
            }}
          />
          <span className="separator">:</span>
          <input
            type="text"
            className="settings-input"
            placeholder="Значення"
            value={param.value}
            onChange={(e) => {
              const newSettings = updateCustomParam(settings, index, 'value', e.target.value)
              setSettings(newSettings)
            }}
          />
          <button 
            className="remove-param-btn"
            onClick={() => {
              const newSettings = removeCustomParam(settings, index)
              setSettings(newSettings)
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
)}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Завантаження даних...</p>
        </div>
      )}

        {data && !loading && (
      <div className="columns">
        {/* XML */}
        <div className="column">
          <div className="column-header">
            <span className="column-icon">📄</span>
            <h3>XML структура</h3>
            <div className="header-buttons">
              <button className="copy-button" onClick={copyToClipboard}>
                {copied ? '✓' : '📋'} {copied ? 'Скопійовано!' : 'Копіювати'}
              </button>
            </div>
          </div>
          <pre className="xml-block">
            <code
              className="hljs"
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(xml, { language: 'xml' }).value
              }}
            />
          </pre>
      </div>

          {/* Візуал */}
          <div className="column visual">
            <div className="column-header">
              <span className="column-icon">👁️</span>
              <h3>Візуальний перегляд</h3>
            </div>
            
            <h3 className="title">{data.title}</h3>

            <div className="price-block">
              <p className="price">{data.price}</p>
            </div>

            <p className="category">{data.category}</p>
            <p className="category">{data.vendor}</p>

            <div className="images">
              {data?.images?.map((src, i) => (
                <img 
                  key={i} 
                  src={src} 
                  className="image" 
                  alt={`Фото ${i + 1}`}
                  onClick={() => openImagePopup(src)} // Додаємо обробник кліку
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'
                  }}
                />
              ))}
            </div>

            <p className="description">
            {isExpanded 
              ? data.description?.replace(/<[^>]*>/g, '') || ''
              : (data.description?.replace(/<[^>]*>/g, '') || '').slice(0, 350) + '...'
            }
            {data.description?.replace(/<[^>]*>/g, '').length > 350 && (
              <button 
                className="expand-button"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Згорнути' : 'Розгорнути'}
              </button>
            )}
           </p>

            <div className="params">
              {data?.params?.map((p, i) => (
                <div key={i} className="param">
                  <span className="param-label">{p.label}</span>
                  <span className="param-value">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Редактор */}
          <div className="column editor">
            <div className="column-header">
              <span className="column-icon">✏️</span>
              <h3>Редактор даних</h3>
            </div>

            <input
              className="input-full"
              value={data.title || ''}
              onChange={e => setData({ ...data, title: e.target.value })}
              placeholder="Назва товару"
            />

            <input
              className="input-full"
              value={data.price || ''}
              onChange={e => setData({ ...data, price: e.target.value })}
              placeholder="Ціна"
            />

            <input
              className="input-full"
              value={data.vendor || ''}
              onChange={e => setData({ ...data, vendor: e.target.value })}
              placeholder="Бренд"
            />

            <div className="category-editor-row">
            <input
              className="input-full"
              value={data.category || ''}
              onChange={e => setData({ ...data, category: e.target.value })}
              placeholder="Категорія"
            />
            <button 
              className="button-small save-category-btn"
              onClick={() => {
                if (data.category && data.category !== 'Тестовая категория') {
                  const newSettings = addCategory(settings, data.category)
                  setSettings(newSettings)
                  alert(`Категорію "${data.category}" збережено!`)
                } else if (data.category === 'Тестовая категория') {
                  alert('Це тестова категорія, вона не зберігається')
                } else {
                  alert('Введіть назву категорії')
                }
              }}
            >
              💾
            </button>
          </div>

            <textarea
              className="input-full textarea-small"
              value={data.description || ''}
              onChange={e => setData({ ...data, description: e.target.value })}
              placeholder="Опис товару"
            />

            <div className="params-editor">
              <h4>Параметри</h4>

              {data?.params?.map((param, index) => (
                <div key={index} className="param-row">
                  <input
                    className="param-label-input"
                    value={param.label}
                    onChange={(e) => {
                      const updated = [...data.params]
                      updated[index] = {
                        ...updated[index],
                        label: e.target.value
                      }
                      setData({ ...data, params: updated })
                    }}
                    placeholder="Назва параметра"
                  />

                  <span className="separator">:</span>

                  <input
                    className="param-value-input"
                    value={param.value}
                    onChange={(e) => {
                      const updated = [...data.params]
                      updated[index] = {
                        ...updated[index],
                        value: e.target.value
                      }
                      setData({ ...data, params: updated })
                    }}
                    placeholder="Значення"
                  />

                  <button
                    className="btn-delete"
                    onClick={() => {
                      const updated = data.params.filter((_, i) => i !== index)
                      setData({ ...data, params: updated })
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                className="button add-param"
                onClick={() => {
                  setData({
                    ...data,
                    params: [...(data.params || []), { label: '', value: '' }]
                  })
                }}
              >
                + Додати параметр
              </button>
              
            </div>
          </div>
        </div>
      )}

      {/* Поп-ап для зображення */}
      {selectedImage && (
        <div className="popup-overlay" onClick={closeImagePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closeImagePopup}>✕</button>
            <img 
              src={selectedImage} 
              alt="Збільшене зображення" 
              className="popup-image"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found'
              }}
            />
          </div>
        </div>
      )}
        <Footer />
        {/* SEO блок - видно тільки пошуковим системам */}
        <div className="seo-content" style={{ display: 'none' }}>
          <h1>Парсинг Rozetka в XML для Google Shopping</h1>
          <p>Конвертація товарів з Rozetka в XML формат для Google Shopping, Hotline, Prom, та інших маркетплейсів. 
          Автоматичне створення XML фідів для інтернет-магазинів.</p>
        </div> 
    </div>
  )
}