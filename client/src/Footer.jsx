import { useState } from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  // Замініть на свій Telegram username
  const TELEGRAM_USERNAME = 'volia_D' 

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert('Введіть повідомлення')
      return
    }

    setSending(true)

    try {
      const response = await fetch('http://localhost:3000/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          message
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setSent(true)

      setTimeout(() => {
        setShowModal(false)
        setSent(false)
        setMessage('')
        setEmail('')
      }, 2000)

    } catch (e) {
      console.log(e)
      alert('Помилка відправки')
    } finally {
      setSending(false)
    }
  }

  const openTelegram = () => {
    window.open(`https://t.me/${TELEGRAM_USERNAME}`, '_blank')
  }

  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <span className="footer-icon">🛒</span>
            <span className="footer-text">Rozetka Parser</span>
            <span className="footer-version">v1.0.0</span>
          </div>
          
          <div className="footer-section">
            <button 
              className="footer-link contact-btn"
              onClick={() => setShowModal(true)}
            >
              📧 Написати мені
            </button>
            <button 
              className="footer-link telegram-btn"
              onClick={openTelegram}
            >
              💬 Telegram
            </button>
          </div>
          
          <div className="footer-section">
            <span className="footer-copyright">
              © {currentYear}
            </span>
          </div>
        </div>
      </footer>

      {/* Модальне вікно */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📧 Зв'язок з розробником</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            {sent ? (
              <div className="modal-success">
                ✅ Повідомлення відправлено!
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <div className="modal-field">
                    <label>Ваш Email (необов'язково):</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                  
                  <div className="modal-field">
                    <label>Повідомлення:</label>
                    <textarea
                      placeholder="Напишіть ваші питання або побажання. 
Ми можемо зробити додаток під вас, додати потрібний функціонал. 
Або ж створити повноцінне рішення під ваші потреби."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="modal-textarea"
                      rows={5}
                    />
                  </div>
                  
                  <div className="modal-telegram-hint">
                    <span>💬 Або написати в </span>
                    <button 
                      type="button"
                      className="telegram-link-btn"
                      onClick={openTelegram}
                    >
                      Telegram
                    </button>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn cancel" onClick={() => setShowModal(false)}>
                    Скасувати
                  </button>
                  <button 
                    className="modal-btn send" 
                    onClick={handleSendMessage} 
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <span className="spinner-small"></span> Відправка...
                      </>
                    ) : (
                      '📤 Відправити'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
          
        </div>
        
      )}
      <div className="footer-section seo-links" >
          <a href="/google-shopping-xml">Google Shopping XML</a>
          <a href="/hotline-xml-fid">Hotline XML</a>
          <a href="/prom-xml">Prom XML</a>
          <a href="/rozetka-parser">Rozetka Parser</a>
        </div>
    </>
  )
}