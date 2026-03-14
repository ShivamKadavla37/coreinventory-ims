import { useState, useRef, useEffect } from 'react';
import { HiOutlineChat, HiOutlineX, HiOutlinePaperAirplane, HiOutlineKey, HiOutlineTrash } from 'react-icons/hi';

const SYSTEM_PROMPT = `You are KOSHNETRA AI Assistant — the intelligent helper inside the KOSHNETRA Inventory Management System.
You help Inventory Managers and Warehouse Staff with all inventory-related queries.

About the KOSHNETRA app:
- It is a modular Inventory Management System (IMS) that digitizes stock operations.
- It replaces manual registers and Excel sheets with a centralized, real-time app.

FEATURES YOU KNOW ABOUT:
1. **Dashboard** — Shows KPIs: Total Products, Low Stock / Out of Stock, Pending Receipts, Pending Deliveries, Internal Transfers. Has dynamic filters by document type, status, warehouse, and category.
2. **Products** — Create/update products with Name, SKU, Category, Unit of Measure, Initial Stock, Min Stock Alert. View stock availability per warehouse location.
3. **Receipts (Incoming Goods)** — Create receipts when goods arrive from suppliers. Add supplier name, product, destination warehouse, and quantity. Validate to auto-increase stock.
4. **Delivery Orders (Outgoing Goods)** — Create delivery orders for customer shipments. Validate to auto-decrease stock.
5. **Internal Transfers** — Move stock between warehouses (e.g., Main Warehouse → Production Floor). Each transfer is logged in the Move History ledger.
6. **Stock Adjustments** — Fix mismatches between recorded stock and physical count. Select product/location, enter counted quantity, system auto-updates.
7. **Move History** — Complete ledger of all stock movements (receipts, deliveries, transfers, adjustments). Filter by type.
8. **Low Stock Alerts** — Automatic alerts when product stock drops below the minimum threshold.
9. **Multi-Warehouse Support** — Manage stock across multiple warehouses/locations.
10. **Export** — Export receipts as CSV or PDF for individual transactions.
11. **Settings** — Manage warehouses (name, location, capacity).
12. **Authentication** — Signup with OTP verification, Login, Forgot Password with OTP + reset link.
13. **Profile** — View/edit user profile, change password.

NAVIGATION:
- Dashboard (home page)
- Operations > Receipts, Delivery, Internal Transfers, Stock Adjustments
- Products
- Move History
- Settings (Warehouses)
- Profile (bottom-left widget)

HOW INVENTORY FLOW WORKS:
Step 1: Receive Goods → Receipts → stock +N
Step 2: Internal Transfer → Move between warehouses → total unchanged, location updated
Step 3: Deliver Goods → Delivery Orders → stock -N
Step 4: Adjust → Stock Adjustments → fix mismatches
Everything is logged in the Stock Ledger (Move History).

INSTRUCTIONS:
- Be helpful, concise, and friendly.
- If a user asks how to do something, give step-by-step instructions.
- If a user asks about a feature, explain it clearly.
- You can suggest best practices for inventory management.
- Always refer to the app as "KOSHNETRA".
- Use emojis sparingly for friendliness.
- **STRICT RULE: You must ONLY answer questions related to KOSHNETRA, inventory management, warehouse operations, stock tracking, and the features listed above. If a user asks ANYTHING unrelated (coding, weather, jokes, math, history, general knowledge, personal questions, or any other topic), you MUST politely decline and redirect them back to KOSHNETRA topics. Say something like: "I'm designed exclusively to help with KOSHNETRA inventory operations. I can't help with that topic, but I'd love to assist you with anything inventory-related! 📦"**
- Never break character. Never answer off-topic questions even if the user insists.`;

const QUICK_SUGGESTIONS = [
  { label: '📦 How to add a product?', text: 'How do I add a new product in KOSHNETRA?' },
  { label: '📥 Create a receipt', text: 'How do I create a new receipt for incoming goods?' },
  { label: '🚚 Make a delivery', text: 'How do I create a delivery order to ship items?' },
  { label: '🔄 Internal transfer', text: 'How do I transfer stock between warehouses?' },
  { label: '📊 Dashboard filters', text: 'How do the dashboard filters work?' },
  { label: '⚠️ Low stock alerts', text: 'How do low stock alerts work in KOSHNETRA?' },
  { label: '📋 Export receipts', text: 'How can I export receipts as CSV or PDF?' },
  { label: '🏭 Add a warehouse', text: 'How do I add a new warehouse in Settings?' },
];

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! 👋 I\'m the KOSHNETRA AI Assistant. I can help you navigate the app, explain features, or answer inventory management questions.\n\nTap a suggestion below or type your question!' }
  ]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const envKey = import.meta.env.VITE_GROQ_API_KEY || '';
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || envKey);
  const [keyInput, setKeyInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const saveApiKey = () => {
    localStorage.setItem('groq_api_key', keyInput);
    setApiKey(keyInput);
    setShowKeyModal(false);
    setKeyInput('');
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Chat cleared! How can I help you with KOSHNETRA? Tap a suggestion or type your question!' }
    ]);
    setShowSuggestions(true);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.filter(m => m.role !== 'system').slice(-10),
            userMsg,
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
    } catch (error) {
      console.error('Groq API error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${error.message}. Please check your API key.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like rendering for bold and code
  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold (**text**)
      let parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        // Inline code (`code`)
        return part.split(/(`[^`]+`)/g).map((codePart, k) => {
          if (codePart.startsWith('`') && codePart.endsWith('`')) {
            return <code key={k} className="bg-gray-100 text-rose-600 px-1 rounded text-xs">{codePart.slice(1, -1)}</code>;
          }
          return codePart;
        });
      });
      return <span key={i}>{parts}{i < text.split('\n').length - 1 && <br />}</span>;
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
          title="KOSHNETRA AI Assistant"
        >
          <HiOutlineChat size={26} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <HiOutlineChat className="text-white" size={18} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>KOSHNETRA AI</h3>
                <p className="text-rose-100 text-[10px]">Powered by Groq AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowKeyModal(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="API Key Settings">
                <HiOutlineKey size={16} />
              </button>
              <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Clear Chat">
                <HiOutlineTrash size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <HiOutlineX size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-rose-500 text-white rounded-br-md'
                    : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                }`}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/80 shrink-0">
            <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto">
              {QUICK_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s.text)}
                  className="px-2.5 py-1.5 text-[11px] font-medium rounded-full border border-gray-200 bg-white text-gray-600 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all whitespace-nowrap"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-100 bg-white shrink-0">
            {!apiKey ? (
              <button
                onClick={() => setShowKeyModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-colors border border-rose-200"
              >
                🔑 Set API Key to Start Chatting
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about KOSHNETRA..."
                  className="flex-1 text-sm py-2 px-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 resize-none max-h-20 transition-colors"
                  rows={1}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <HiOutlinePaperAirplane size={16} className="rotate-90" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center" onClick={() => setShowKeyModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Groq API Key</h3>
              <button onClick={() => setShowKeyModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <HiOutlineX size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Enter your Groq API key from <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline font-medium">console.groq.com</a> to enable the AI assistant.
              Your key is stored locally in your browser.
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="gsk-xxxxxxxxxxxxxxxx"
              className="input-field mb-4"
              autoFocus
            />
            {apiKey && (
              <p className="text-xs text-emerald-600 mb-3 flex items-center gap-1">
                ✅ Current key: {apiKey.slice(0, 8)}...{apiKey.slice(-4)}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowKeyModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveApiKey} disabled={!keyInput.trim()} className="btn-primary flex-1 disabled:opacity-50">Save Key</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
