import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I am the FoodSafety AI. Ask me about exactly how long specific foods stay fresh, how to handle leftovers, or what to do with expired food (like composting)!", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
        setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing API Key");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are a helpful and concise AI assistant for a local food waste reduction platform named FoodRescue. 
      The user asks: "${userMessage}". 
      Please provide a concise, highly accurate, and friendly answer strictly focusing on:
      - general food hygiene/safety.
      - estimating how long this specific food stays fresh.
      - giving practical advice on what can be done with it if it is expired (e.g. repacking, animal shelters, or composting).
      Do not hallucinate facts if you do not know. Keep your response under 100 words total. Format with emojis where helpful!`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      setMessages(prev => [...prev, { text: text, sender: 'bot' }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { text: `Error: ${error.message || JSON.stringify(error)}`, sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(true)}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageCircle size={28} />
      </button>

      {isOpen && (
        <div className="chatbot-window fade-in" style={{
            position: 'fixed', bottom: '2rem', right: '2rem', width: '350px', 
            height: '500px', background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000
        }}>
          <div className="chatbot-header" style={{
              background: 'var(--primary-color)', color: 'white', padding: '1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTopLeftRadius: '16px', borderTopRightRadius: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} />
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'white' }}>Food Safety AI</h4>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          
          <div className="chatbot-messages" style={{
              flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className="chat-bubble" style={{
                    maxWidth: '85%', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.4',
                    background: msg.sender === 'user' ? 'var(--primary-color)' : '#f1f5f9',
                    color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                    whiteSpace: 'normal', overflowWrap: 'break-word'
                }}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#f1f5f9', fontSize: '0.9rem' }}>
                  Generating safety advice...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{
              display: 'flex', padding: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)', background: 'white',
              borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
          }}>
            <input 
              type="text" 
              placeholder="How long does chicken last?" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, border: '1px solid #ccc', padding: '0.6rem', borderRadius: '8px 0 0 8px', outline: 'none' }}
            />
            <button type="submit" disabled={isTyping} style={{
                background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0 1rem',
                borderRadius: '0 8px 8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
