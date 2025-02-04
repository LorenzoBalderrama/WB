import { useState } from 'react'
import { w3cwebsocket as W3CWebSocket } from 'websocket'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callStatus, setCallStatus] = useState('idle')
  const [messages, setMessages] = useState([])
  const [sttStatus, setSttStatus] = useState({})
  const [ttsStatus, setTtsStatus] = useState({})

  const initiateCall = async () => {
    try {
      const response = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      const data = await response.json()
      
      if (data.callSid) {
        connectWebSocket(data.callSid)
        setCallStatus('connecting')
      }
    } catch (error) {
      console.error('Failed to initiate call:', error)
    }
  }

  const connectWebSocket = (callSid) => {
    const ws = new W3CWebSocket(`wss://your-domain.com/convo-relay/${callSid}`)
    
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data)
      switch (data.type) {
        case 'text':
          setMessages(prev => [...prev, data])
          break
        case 'stt':
          setSttStatus(data)
          break
        case 'tts':
          setTtsStatus(data)
          break
        case 'status':
          setCallStatus(data.status)
          break
      }
    }
  }

  return (
    <div className="app-container">
      <div className="call-interface">
        <div className="call-controls">
          <input 
            type="tel" 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
          />
          <button onClick={initiateCall}>Make Call</button>
          <div className="status">Call Status: {callStatus}</div>
        </div>

        <div className="conversation-display">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.source}`}>
              {msg.token}
            </div>
          ))}
        </div>

        <div className="insights">
          <div className="stt-status">
            <h3>Speech-to-Text Status</h3>
            <pre>{JSON.stringify(sttStatus, null, 2)}</pre>
          </div>
          <div className="tts-status">
            <h3>Text-to-Speech Status</h3>
            <pre>{JSON.stringify(ttsStatus, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
