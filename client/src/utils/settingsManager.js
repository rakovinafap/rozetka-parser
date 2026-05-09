// utils/settingsManager.js

const STORAGE_KEY = 'rozetka_parser_settings'

const defaultSettings = {
  textOfferId: 'myId-',
  offerId: '1',
  addIdToName: false,
  categories: [],  // масив категорій [{id: 1, name: "Назва"}]
  lastUpdate: new Date().toISOString(),
  stockQuantity: 20,
  showXMLHeader: true,
  customParams: [{ label: '', value: '' }],  // масив кастомних параметрів [{ label: 'label', value: 'value' }]
}

// Завантаження налаштувань
export const loadSettings = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    return JSON.parse(saved)
  }
  return { ...defaultSettings }
}

// Збереження налаштувань
export const saveSettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

// Оновлення конкретного поля
export const updateSettingsField = (settings, key, value) => {
  const newSettings = { 
    ...settings, 
    [key]: value, 
    lastUpdate: new Date().toISOString() 
  }
  saveSettings(newSettings)
  return newSettings
}

// Скидання до стандартних
export const resetSettings = () => {
  const defaultSettingsCopy = { ...defaultSettings, lastUpdate: new Date().toISOString() }
  saveSettings(defaultSettingsCopy)
  return defaultSettingsCopy
}

// Отримати наступний ID
export const getNextId = (currentId) => {
  return String(Number(currentId) + 1)
}

// Додати категорію (без дублів)
export const addCategory = (settings, categoryName) => {
  if (!categoryName?.trim()) return settings
  
  const categories = settings.categories || []
  
  // Перевіряємо чи вже є
  const exists = categories.some(
    c => c.name.toLowerCase() === categoryName.toLowerCase().trim()
  )
  
  if (exists) return settings
  
  // Нова категорія з ID = довжина + 1
  const newId = categories.length + 1
  const newCategory = { id: String(newId), name: categoryName.trim() }
  
  const newSettings = {
    ...settings,
    categories: [...categories, newCategory]
  }
  
  saveSettings(newSettings)
  return newSettings
}

// Отримати ID категорії за назвою
export const getCategoryId = (settings, categoryName) => {
  const categories = settings.categories || []
  const category = categories.find(
    c => c.name.toLowerCase() === categoryName?.toLowerCase().trim()
  )
  return category?.id || '1'
}

// Очистити всі категорії
export const clearCategories = (settings) => {
  const newSettings = {
    ...settings,
    categories: []
  }
  saveSettings(newSettings)
  return newSettings
}

// Додати кастомний параметр
export const addCustomParam = (settings, param) => {
  // Прибираємо перевірку на пустий label, дозволяємо додавати пусті параметри
  const customParams = settings.customParams || []
  
  const newSettings = {
    ...settings,
    customParams: [...customParams, { label: param.label || '', value: param.value || '' }]
  }
  
  saveSettings(newSettings)
  return newSettings
}

// Видалити кастомний параметр
export const removeCustomParam = (settings, index) => {
  const customParams = settings.customParams || []
  const newSettings = {
    ...settings,
    customParams: customParams.filter((_, i) => i !== index)
  }
  saveSettings(newSettings)
  return newSettings
}

// Оновити кастомний параметр
export const updateCustomParam = (settings, index, key, value) => {
  const customParams = settings.customParams || []
  const updatedParams = [...customParams]
  updatedParams[index] = { ...updatedParams[index], [key]: value }
  
  const newSettings = {
    ...settings,
    customParams: updatedParams
  }
  saveSettings(newSettings)
  return newSettings
}

export default {
  loadSettings,
  saveSettings,
  updateSettingsField,
  resetSettings,
  getNextId,
  addCategory,
  getCategoryId,
  addCustomParam,
  removeCustomParam,
  updateCustomParam,
}