import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, MessageSquare, X, Send, Sparkles, Heart, 
  GraduationCap, Phone, MapPin, PackageCheck, Utensils, 
  ExternalLink, ChevronRight, Volume2
} from 'lucide-react';

const PROACTIVE_QUOTES = [
  {
    icon: Heart,
    text: "Want to donate or sponsor a meal for our children? Tap here to ask me!",
    badge: "Support Children"
  },
  {
    icon: GraduationCap,
    text: "Need help joining our hostel or filling the admission form? I can guide you!",
    badge: "Admissions Help"
  },
  {
    icon: PackageCheck,
    text: "Looking for our urgent hostel needs like groceries, books & uniforms?",
    badge: "Hostel Needs"
  },
  {
    icon: Phone,
    text: "Want to speak directly with Founder Brother Nelson (+91 90594 91777)?",
    badge: "Direct Contact"
  },
  {
    icon: MapPin,
    text: "Visiting us in Mannar Polur, Sullurpeta? Ask me for directions & timings!",
    badge: "Campus Visit"
  }
];

const QUICK_ACTIONS = [
  { label: "💖 How to donate?", prompt: "How can I donate or sponsor a meal?" },
  { label: "🎓 Admission help", prompt: "How can I apply for admission for a child?" },
  { label: "📦 Urgent hostel needs", prompt: "What are the hostel's urgent needs right now?" },
  { label: "🍲 Food menu & routine", prompt: "What is the children's daily routine and food menu?" },
  { label: "📍 Location & timings", prompt: "Where is the hostel located and what are visiting hours?" },
  { label: "📞 Contact Bro. Nelson", prompt: "How can I contact Brother Nelson directly?" }
];

function generateAIResponse(userText, settings, setActiveTab) {
  const query = userText.toLowerCase().trim();
  const phone = settings?.contact_phone || '+91 90594 91777';
  const upiId = settings?.upi_id || 'riseachild@sbi';
  const upiName = settings?.upi_name || 'RISE A CHILD Welfare Trust';
  const hostelName = settings?.hostel_name || 'RISE A CHILD CHILDREN HOME';
  const address = settings?.contact_address || 'Mannar Polur, Sullurpeta Mandal, Tirupati District, AP - 524121';

  // 1. Donation / Sponsor
  if (query.includes('donat') || query.includes('give') || query.includes('upi') || query.includes('gpay') || query.includes('phonepe') || query.includes('sponsor') || query.includes('money') || query.includes('fund')) {
    return {
      text: `🙏 Thank you for your generous heart to bless our children!

You can donate directly through transparent digital channels:
• **UPI ID**: \`${upiId}\`
• **Beneficiary**: ${upiName}
• **Google Pay / PhonePe**: ${phone}
• **Bank**: State Bank of India, Sullurpeta Main Branch (A/C: 38491029384, IFSC: SBIN0001423)

Every rupee directly provides nutritious meals, school books, tuition coaching, and medical care for resident students.`,
      action: {
        label: "View Urgent Needs & Donate",
        tab: "needed"
      }
    };
  }

  // 2. Admissions / Joining
  if (query.includes('admiss') || query.includes('join') || query.includes('apply') || query.includes('seat') || query.includes('school') || query.includes('register') || query.includes('admission form')) {
    return {
      text: `🎓 **Hostel Admission Guidance**:

${hostelName} welcomes students and youths of all classes and educational stages (Primary, Secondary, Higher Secondary, & College):
• **Facilities**: 100% loving shelter, wholesome 4-times daily meals, study supervision, and moral care.
• **Process**: You can fill out the simple online application right here on the website, upload a photo, and receive an instant application tracking number.
• Our Managing Trustee, **BRO.NELSON A**, reviews all applications with genuine care.`,
      action: {
        label: "Open Online Admission Form",
        tab: "admissions"
      }
    };
  }

  // 3. Urgent Needs / In-kind
  if (query.includes('need') || query.includes('grocer') || query.includes('rice') || query.includes('book') || query.includes('cloth') || query.includes('uniform') || query.includes('item')) {
    return {
      text: `📦 **Urgent Hostel Needs**:

Our children currently welcome support for:
1. Wholesome Groceries: Rice, Toor Dal, Cooking Oil, Milk & Eggs.
2. Academic Essentials: Notebooks, School Bags, Geometry Sets & Exam Pens.
3. Health & Hygiene: Bath Soaps, Toothpaste, Washing Powder, Sanitizers.

You can pledge specific items or donate in-kind directly at our campus!`,
      action: {
        label: "View Real-Time Needs Audit",
        tab: "needed"
      }
    };
  }

  // 4. Routine, Timetable & Food Menu
  if (query.includes('menu') || query.includes('food') || query.includes('routine') || query.includes('timetable') || query.includes('diet') || query.includes('eat') || query.includes('schedule')) {
    return {
      text: `🍲 **Daily Routine & Wholesome Diet**:

• **5:30 AM**: Wake up, personal hygiene & morning prayer.
• **6:30 AM**: Yoga, physical wellness & study revision.
• **7:30 AM**: Wholesome breakfast (Idli/Dosa/Upma + Milk).
• **8:30 AM - 4:30 PM**: Schooling & academic classes.
• **5:00 PM**: Nutritious evening snacks & playground games.
• **6:00 PM - 8:30 PM**: Supervised coaching & homework study.
• **8:30 PM**: Balanced dinner (Rice, Sambar, Veg curry, Dal, Egg/Curd) & peaceful rest.`,
      action: {
        label: "View Weekly Food Menu",
        tab: "menu"
      }
    };
  }

  // 5. Contact / Brother Nelson
  if (query.includes('contact') || query.includes('nelson') || query.includes('phone') || query.includes('number') || query.includes('call') || query.includes('email') || query.includes('founder')) {
    return {
      text: `📞 **Direct Contact Information**:

• **Founder & Managing Trustee**: BRO.NELSON A
• **Mobile & WhatsApp**: ${phone}
• **Official Email**: ${settings?.contact_email || 'pn9059491777@gmail.com'}
• **Campus Address**: ${address}

Brother Nelson is personally available to speak with parents, guardians, and generous supporters!`,
      action: {
        label: "Call Brother Nelson Now",
        href: `tel:${phone.replace(/\s+/g, '')}`
      }
    };
  }

  // 6. Location / Visiting hours / Mannar Polur
  if (query.includes('locat') || query.includes('visit') || query.includes('address') || query.includes('where') || query.includes('map') || query.includes('sullurpeta')) {
    return {
      text: `📍 **Hostel Location & Visiting Protocol**:

• **Address**: ${address}
• **Landmark**: Near Mannar Polur, Sullurpeta Mandal, Tirupati District, Andhra Pradesh (PIN 524121).
• **Visiting Hours**: Saturdays & Sundays (10:00 AM – 5:00 PM).
• **Visitor Protocol**: For the safety and privacy of all resident children, all visitors are requested to sign the visitor log at the entrance and adhere to hostel ethics.`,
      action: {
        label: "Open Google Maps Directions",
        href: settings?.map_directions_url || 'https://www.google.com/maps/dir/?api=1&destination=13.705267,79.999285'
      }
    };
  }

  // 7. Safety, Licence & JJ Act
  if (query.includes('safe') || query.includes('rule') || query.includes('licen') || query.includes('gov') || query.includes('jj act') || query.includes('trust')) {
    return {
      text: `🛡️ **Safety & Statutory Compliance**:

• ${hostelName} is fully registered under the **Juvenile Justice (Care & Protection of Children) Act, 2015**.
• We maintain 24/7 dedicated resident wardens, CCTV safety monitoring of campus perimeters, strict child privacy standards, and certified fire & sanitation compliance.`,
      action: {
        label: "Inspect Government Licences",
        tab: "licence"
      }
    };
  }

  // Default friendly response
  return {
    text: `Hello! I am the official AI Guide of **${hostelName}**.

I can assist you with:
1. **Donations & Meal Sponsorship** (via UPI, GPay, Bank)
2. **Student Admissions & Requirements** (Primary to College)
3. **Urgent Needs List** (Groceries, Clothes, School Supplies)
4. **Campus Visiting Hours & Daily Timetable**
5. **Direct Connect with Founder BRO.NELSON A**

Feel free to tap any of the quick topics below or ask your question directly!`,
    action: {
      label: "Support Our Children",
      tab: "needed"
    }
  };
}

export default function HomeAIAssistant({ settings, setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello & welcome to **${settings?.hostel_name || 'RISE A CHILD CHILDREN HOME'}**! 🙏\n\nI'm your AI Hostel Assistant. How can I guide you today? You can ask about **admissions**, **donations**, **urgent hostel needs**, or **visiting hours**.`,
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-rotate proactive quotes every 9 seconds
  useEffect(() => {
    if (bubbleDismissed || isOpen) return;
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % PROACTIVE_QUOTES.length);
      setShowSpeechBubble(true);
    }, 9000);
    return () => clearInterval(interval);
  }, [bubbleDismissed, isOpen]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = (textToSend = null) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(text, settings, setActiveTab);
      const aiMsg = {
        sender: 'ai',
        text: response.text,
        action: response.action,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const currentQuote = PROACTIVE_QUOTES[quoteIndex];
  const QuoteIcon = currentQuote.icon;

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none font-sans">
      {/* 1. PROACTIVE FLOATING SPEECH BUBBLE (Prompts visitors with quotes) */}
      {!isOpen && showSpeechBubble && !bubbleDismissed && (
        <div 
          className="absolute bottom-full right-0 mb-3 w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-blue-200 animate-in fade-in slide-in-from-bottom-2 text-slate-800 transition-all hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between gap-2">
            <div 
              onClick={() => {
                setIsOpen(true);
                setShowSpeechBubble(false);
              }}
              className="flex items-start space-x-2.5 cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <QuoteIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-1">
                  {currentQuote.badge}
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {currentQuote.text}
                </p>
                <span className="text-[10px] text-blue-600 font-bold flex items-center mt-1">
                  <span>Chat with AI Guide</span>
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeechBubble(false);
                setBubbleDismissed(true);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              title="Dismiss prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tiny Speech Pointer Arrow */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white/95 border-r border-b border-blue-200 transform rotate-45" />
        </div>
      )}

      {/* 2. CHAT WINDOW / DRAWER */}
      {isOpen && (
        <div className="absolute bottom-0 right-0 w-[92vw] sm:w-[400px] h-[550px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white overflow-hidden p-1 shadow-sm">
                  <img
                    src={settings?.logo_url || "/logo.png"}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <Bot className="w-5 h-5 text-amber-300 absolute" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-serif text-white flex items-center space-x-1.5">
                  <span>RISE A CHILD AI Guide</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-slate-200">
                  Online • Trained on Hostel Rules & Facts
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs sm:text-sm">
            {messages.map((m, idx) => {
              const isAi = m.sender === 'ai';
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${
                      isAi
                        ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                        : 'bg-blue-600 text-white rounded-tr-xs shadow-blue-200'
                    }`}
                  >
                    <div className="whitespace-pre-line text-xs">
                      {m.text}
                    </div>

                    {/* Interactive Action Button in AI Reply */}
                    {m.action && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center">
                        {m.action.tab ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab(m.action.tab);
                              setIsOpen(false);
                            }}
                            className="w-full py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-xs transition"
                          >
                            <span>{m.action.label}</span>
                            <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
                          </button>
                        ) : m.action.href ? (
                          <a
                            href={m.action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-xs transition"
                          >
                            <span>{m.action.label}</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {m.time}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center space-x-1.5 bg-white border border-slate-200 p-2.5 rounded-2xl w-20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(action.prompt)}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full text-[11px] font-semibold border border-slate-200 transition flex-shrink-0 cursor-pointer"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask anything about our children home..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 3. FLOATING ROUND BUTTON ON RIGHT (Stable on Home Screen) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setShowSpeechBubble(false);
          }}
          className="relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-2xl flex items-center justify-center border-2 border-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          title="Open AI Hostel Assistant"
        >
          {/* Subtle Outer Ping Wave */}
          <span className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping pointer-events-none" />

          {/* Inner Logo / Avatar */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="w-full h-full object-contain filter drop-shadow"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : null}
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
          </div>

          {/* Active Online Status Dot */}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
        </button>
      )}
    </div>
  );
}

function ArrowRightIcon(props) {
  return (
    <svg 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={2.5} 
      stroke="currentColor" 
      className={props.className || "w-4 h-4"}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
