(function () {
  'use strict';

  // Supported languages dictionary
  const LANGUAGES = {
    'en-IN': {
      code: 'en-IN',
      name: 'English (India)',
      tag: 'EN',
      welcome: "Hello! Welcome to HAVOC – Vision to Creator Connect. I'm your AI Voice Assistant. How can I guide you today?",
      listeningText: "Listening... speak now in English",
      explainingCreator: (name, role, rate, rating) => `${name} is an expert ${role} based with a rating of ${rating} stars and starting rate of $${rate} per hour. Explore their portfolio and verified projects below.`,
      commands: {
        creators: "Navigating to Explore Creators directory with top verified AI specialists.",
        brand: "Opening For Brands space with AI brief matching and candidate evaluation.",
        studio: "Opening For Creators studio space to showcase portfolios and manage invites.",
        home: "Heading back to the HAVOC homepage."
      },
      fallbackError: "Speech recognition unavailable or microphone denied. You can still type or browse anytime!"
    },
    'ta-IN': {
      code: 'ta-IN',
      name: 'தமிழ் (Tamil)',
      tag: 'TA',
      welcome: "வணக்கம்! ஹாவோக் (HAVOC) கிரியேட்டர் தளத்திற்கு உங்களை வரவேற்கிறோம். நான் உங்கள் குரல் உதவியாளர். உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?",
      listeningText: "கேட்கிறது... தமிழில் பேசுங்கள்",
      explainingCreator: (name, role, rate, rating) => `${name} ஒரு சிறந்த ${role} நிபுணர். இவர்களின் மதிப்பீடு ${rating} நட்சத்திரங்கள், மற்றும் ஒரு மணி நேர கட்டணம் $${rate}. இவர்களின் போர்ட்ஃபோலியோ படைப்புகளை கீழே காணலாம்.`,
      commands: {
        creators: "கிரியேட்டர்கள் பக்கத்திற்கு செல்கிறது. 10+ முன்னணி AI நிபுணர்கள் உள்ளனர்.",
        brand: "பிராண்ட் பக்கத்திற்கு செல்கிறது. AI திட்டப் பொருத்தம் மற்றும் மேட்ச் அறிக்கை தயார்.",
        studio: "கிரியேட்டர் ஸ்டுடியோ பக்கத்திற்கு செல்கிறது. உங்கள் படைப்புகளை பதிவேற்றலாம்.",
        home: "முகப்புப் பக்கத்திற்கு செல்கிறது."
      },
      fallbackError: "குரல் ஏற்பி கிடைக்கவில்லை அல்லது மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது."
    },
    'hi-IN': {
      code: 'hi-IN',
      name: 'हिन्दी (Hindi)',
      tag: 'HI',
      welcome: "नमस्ते! HAVOC – विज़न टू क्रिएटर कनेक्ट में आपका स्वागत है। मैं आपका वॉइस असिस्टेंट हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?",
      listeningText: "सुन रहा हूँ... अब हिन्दी में बोलें",
      explainingCreator: (name, role, rate, rating) => `${name} एक कुशल ${role} विशेषज्ञ हैं। इनकी रेटिंग ${rating} स्टार है और दर $${rate} प्रति घंटा है। इनके कार्य और पोर्टफोलियो नीचे देखें।`,
      commands: {
        creators: "क्रिएटर्स डायरेक्टरी पर जा रहे हैं, जहाँ 10 से अधिक सत्यापित AI कलाकार हैं।",
        brand: "ब्रांड स्पेस खोला जा रहा है, जहाँ AI मैचिंग और प्रोजेक्ट ब्रीफ उपलब्ध हैं।",
        studio: "क्रिएटर स्टूडियो खोला जा रहा है, जहाँ आप काम शोकेस कर सकते हैं।",
        home: "होमपेज पर वापस जा रहे हैं।"
      },
      fallbackError: "आवाज़ पहचान अनुपलब्ध है या माइक्रोफ़ोन अनुमति नहीं मिली।"
    }
  };

  let currentLang = 'en-IN';
  let isListening = false;
  let recognition = null;
  let synth = window.speechSynthesis;

  // Initialize Speech Recognition if supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }
  }

  // Voice selector helper
  function getVoiceForLang(langCode) {
    if (!synth) return null;
    const voices = synth.getVoices();
    // Try exact match first
    let voice = voices.find(v => v.lang === langCode || v.lang.replace('_', '-') === langCode);
    if (!voice) {
      // Try language prefix match (e.g. ta, hi, en)
      const prefix = langCode.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(prefix));
    }
    return voice || null;
  }

  function speakText(text) {
    if (!synth) {
      updateAssistantUI(text);
      return;
    }
    synth.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang;
    const voice = getVoiceForLang(currentLang);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeakingVisual(true);
    };
    utterance.onend = () => {
      setSpeakingVisual(false);
    };
    utterance.onerror = (e) => {
      console.warn('TTS error:', e);
      setSpeakingVisual(false);
    };

    updateAssistantUI(text);
    synth.speak(utterance);
  }

  function setSpeakingVisual(speaking) {
    const pulse = document.getElementById('havoc-assistant-pulse');
    if (pulse) {
      pulse.style.display = speaking ? 'block' : 'none';
    }
  }

  function updateAssistantUI(message) {
    const bubble = document.getElementById('havoc-assistant-bubble');
    if (bubble) {
      bubble.innerText = message;
      bubble.style.display = 'block';
    }
  }

  function handleVoiceCommand(raw) {
    const transcript = raw.toLowerCase().trim();
    updateAssistantUI(`"${raw}"`);

    // Intent routing
    if (transcript.includes('creator') || transcript.includes('கிரியேட்டர்') || transcript.includes('क्रिएटर') || transcript.includes('कलाकार')) {
      speakText(LANGUAGES[currentLang].commands.creators);
      setTimeout(() => { if (window.location.pathname !== '/creators') window.location.href = '/creators'; }, 1500);
    } else if (transcript.includes('brand') || transcript.includes('பிராண்ட்') || transcript.includes('ब्रांड') || transcript.includes('कंपनी')) {
      speakText(LANGUAGES[currentLang].commands.brand);
      setTimeout(() => { if (window.location.pathname !== '/brand') window.location.href = '/brand'; }, 1500);
    } else if (transcript.includes('studio') || transcript.includes('upload') || transcript.includes('ஸ்டுடியோ') || transcript.includes('பதிவேற்ற') || transcript.includes('स्टूडियो')) {
      speakText(LANGUAGES[currentLang].commands.studio);
      setTimeout(() => { if (window.location.pathname !== '/studio') window.location.href = '/studio'; }, 1500);
    } else if (transcript.includes('home') || transcript.includes('முகப்பு') || transcript.includes('होम')) {
      speakText(LANGUAGES[currentLang].commands.home);
      setTimeout(() => { if (window.location.pathname !== '/') window.location.href = '/'; }, 1500);
    } else if (transcript.includes('explain') || transcript.includes('who') || transcript.includes('யார்') || transcript.includes('விளக்கு') || transcript.includes('बताओ') || transcript.includes('विवरण')) {
      explainCurrentContext();
    } else {
      // General response
      if (currentLang === 'ta-IN') {
        speakText(`ஹாவோக் தளத்தில் 10க்கும் மேற்பட்ட கிரியேட்டர்கள், 5 பிராண்டுகள் மற்றும் AI மேட்சிங் சேவை உள்ளது. 'Explore Creators' அல்லது 'For Brands' என்று கூறி முயற்சிக்கவும்.`);
      } else if (currentLang === 'hi-IN') {
        speakText(`HAVOC पर 10 से अधिक AI क्रिएटर्स, 5 ब्रांड्स और AI मैचिंग सिस्टम उपलब्ध हैं। 'क्रिएटर्स' या 'ब्रांड' कहकर अन्वेषण करें।`);
      } else {
        speakText(`HAVOC connects brands with verified AI creators. You can explore 10+ creators, 5 brand campaigns, or test AI recommendations. Say "Creators", "Brand", or "Explain".`);
      }
    }
  }

  function explainCurrentContext() {
    // Check if on a creator page or if creators are loaded
    const path = window.location.pathname;
    if (path.includes('/creators/')) {
      const slug = path.split('/creators/')[1];
      const creators = window.HAVOC_CREATORS || [];
      const c = creators.find(x => x.slug === slug);
      if (c) {
        speakText(LANGUAGES[currentLang].explcribingCreator ? LANGUAGES[currentLang].explainingCreator(c.name, c.role, c.rate, c.rating) : `${c.name}: ${c.role}`);
        return;
      }
    }

    if (currentLang === 'ta-IN') {
      speakText("இந்த தளத்தில் வீடியோ, வாய்ஸ், பேஷன் மற்றும் சாட்போட் AI படைப்பாளிகள் உள்ளனர். அவர்களின் போர்ட்ஃபோலியோவை நேரடியாக பார்வையிடலாம்.");
    } else if (currentLang === 'hi-IN') {
      speakText("यहाँ वॉयस AI, वीडियो, फैशन और एजेंट्स के शीर्ष क्रिएटर्स मौजूद हैं। आप सीधे उनका काम देख सकते हैं और संपर्क कर सकते हैं।");
    } else {
      speakText("This platform showcases elite AI talent across Voice AI, Generative Film, Chatbots, and Agents. Click any creator to inspect their portfolios, packages, and client reviews.");
    }
  }

  function toggleListening() {
    if (!recognition) {
      alert(LANGUAGES[currentLang].fallbackError);
      speakText(LANGUAGES[currentLang].welcome);
      return;
    }

    if (isListening) {
      recognition.stop();
      isListening = false;
      document.getElementById('havoc-mic-btn').classList.remove('listening');
      return;
    }

    try {
      recognition.lang = currentLang;
      recognition.onstart = () => {
        isListening = true;
        document.getElementById('havoc-mic-btn').classList.add('listening');
        updateAssistantUI(LANGUAGES[currentLang].listeningText);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
      };
      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        isListening = false;
        document.getElementById('havoc-mic-btn').classList.remove('listening');
        updateAssistantUI("Microphone error: " + event.error + ". Please try typing or clicking.");
      };
      recognition.onend = () => {
        isListening = false;
        const btn = document.getElementById('havoc-mic-btn');
        if (btn) btn.classList.remove('listening');
      };
      recognition.start();
    } catch (err) {
      console.warn('Error starting recognition:', err);
      isListening = false;
    }
  }

  // Create UI Widget
  function injectWidget() {
    if (document.getElementById('havoc-voice-assistant')) return;

    const container = document.createElement('div');
    container.id = 'havoc-voice-assistant';
    container.innerHTML = `
      <div id="havoc-assistant-bubble" style="display:none;position:fixed;bottom:80px;right:24px;max-width:320px;background:rgba(23,23,28,0.92);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:12px 16px;border-radius:18px;font-size:13px;line-height:1.45;box-shadow:0 12px 30px rgba(0,0,0,0.5);z-index:999999;transition:all 0.3s ease;"></div>
      <div id="havoc-assistant-panel" style="position:fixed;bottom:20px;right:24px;display:flex;align-items:center;gap:8px;background:rgba(20,20,24,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.12);padding:6px 10px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:999999;font-family:inherit;">
        <select id="havoc-lang-select" style="background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:4px 8px;font-size:11px;font-weight:600;outline:none;cursor:pointer;">
          <option value="en-IN" selected>EN (English)</option>
          <option value="ta-IN">TA (தமிழ்)</option>
          <option value="hi-IN">HI (हिन्दी)</option>
        </select>
        <button id="havoc-explain-btn" title="Explain this page" style="background:rgba(255,255,255,0.08);border:none;color:#cbd5e1;cursor:pointer;padding:6px 10px;border-radius:20px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;">
          <span>🔊</span> Explain
        </button>
        <button id="havoc-mic-btn" title="Voice Assist" style="position:relative;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,0.4);">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          <span id="havoc-assistant-pulse" style="display:none;position:absolute;inset:-4px;border:2px solid #a855f7;border-radius:50%;animation:havocPulse 1.2s infinite;"></span>
        </button>
      </div>
      <style>
        @keyframes havocPulse {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        #havoc-mic-btn.listening {
          background: #ef4444 !important;
          animation: havocPulse 1s infinite alternate;
        }
      </style>
    `;
    document.body.appendChild(container);

    // Wire events
    const select = document.getElementById('havoc-lang-select');
    select.addEventListener('change', (e) => {
      currentLang = e.target.value;
      speakText(LANGUAGES[currentLang].welcome);
    });

    const explainBtn = document.getElementById('havoc-explain-btn');
    explainBtn.addEventListener('click', () => {
      explainCurrentContext();
    });

    const micBtn = document.getElementById('havoc-mic-btn');
    micBtn.addEventListener('click', () => {
      toggleListening();
    });

    // Add Chat Drawer / Modal Button
    const chatBtn = document.createElement('button');
    chatBtn.id = 'havoc-chat-modal-btn';
    chatBtn.title = 'AI Marketplace Assistant';
    chatBtn.innerHTML = `💬 Chat`;
    chatBtn.style.cssText = 'background:rgba(255,255,255,0.08);border:none;color:#cbd5e1;cursor:pointer;padding:6px 10px;border-radius:20px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;';
    chatBtn.onclick = () => openChatModal();
    document.getElementById('havoc-assistant-panel').insertBefore(chatBtn, micBtn);
  }

  // 4. FULL FEATURED MULTIMODAL AI CHAT MODAL
  let activeConversationId = 'conv-' + Date.now();
  let pendingAttachments = [];

  function openChatModal() {
    if (!document.getElementById('havoc-ai-chat-modal')) {
      injectChatModal();
    }
    document.getElementById('havoc-ai-chat-modal').style.display = 'flex';
  }

  function linkToAiAssistant() {
    const panel = document.getElementById('havoc-assistant-panel');
    if (panel) {
      panel.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      panel.style.transform = 'scale(1.15)';
      panel.style.boxShadow = '0 0 35px #8b5cf6, 0 0 70px rgba(99,102,241,0.6)';
      panel.style.borderColor = '#c084fc';
      setTimeout(() => {
        panel.style.transform = 'scale(1)';
        panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
        panel.style.borderColor = 'rgba(255,255,255,0.12)';
      }, 2000);
    }
    openChatModal();
    if (LANGUAGES[currentLang] && LANGUAGES[currentLang].welcome) {
      updateAssistantUI(LANGUAGES[currentLang].welcome);
    }
    const assistantTab = document.getElementById('radix-_R_iiq_-trigger-assistant');
    if (assistantTab) assistantTab.click();
  }

  window.linkToAiAssistant = linkToAiAssistant;
  window.openHavocChat = openChatModal;
  window.havocVoiceToggle = toggleListening;
  window.havocVoiceExplain = explainCurrentContext;


  function injectChatModal() {
    let currentUser = null;
    try {
      const u = localStorage.getItem('havoc_user');
      if (u) currentUser = JSON.parse(u);
    } catch (e) {}

    const isCreator = currentUser && currentUser.role === 'creator';
    const userBadge = currentUser
      ? `<span style="background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.35);color:#a5b4fc;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">${isCreator ? 'AI Creator' : 'Brand'}: ${escapeHtml(currentUser.full_name)}</span>`
      : '';

    const welcomeMsg = isCreator
      ? `👋 Hello <strong>${escapeHtml(currentUser.full_name)}</strong>! I'm your Creator AI Co-pilot. I can help benchmark your rates, audit attached reels/audio files, structure tiered packages, and draft proposals for prospective brands.`
      : `👋 Hello! I'm your HAVOC AI Assistant. You can attach creative briefs, brand lookbooks (images), audio samples, video reels, or spreadsheet requirements, and ask me to match creators or analyze deliverables.`;

    const creatorChips = isCreator
      ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">
          <button type="button" class="havoc-quick-chip" data-prompt="Help optimize my packages and hourly rate" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:#cbd5e1;padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;">💡 Optimize Packages</button>
          <button type="button" class="havoc-quick-chip" data-prompt="Draft a proposal for an incoming brand invite" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:#cbd5e1;padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;">📝 Draft Proposal</button>
          <button type="button" class="havoc-quick-chip" data-prompt="Audit my portfolio reel and recommend improvements" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:#cbd5e1;padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;">🎬 Portfolio Audit</button>
        </div>`
      : '';

    const modal = document.createElement('div');
    modal.id = 'havoc-ai-chat-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:9999999;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="width:100%;max-width:680px;height:650px;background:#18181b;border:1px solid rgba(255,255,255,0.18);border-radius:24px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.8);color:#fff;font-family:inherit;">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 10px #8b5cf6;"></span>
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <h3 style="margin:0;font-size:15px;font-weight:700;">HAVOC AI Assistant</h3>
                ${userBadge}
              </div>
              <p style="margin:2px 0 0;font-size:11px;color:#94a3b8;">Multimodal Creator Matching & Creative Brief Expert</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button id="havoc-new-chat-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;cursor:pointer;">+ New Chat</button>
            <button id="havoc-chat-close-btn" style="background:rgba(255,255,255,0.08);border:none;color:#cbd5e1;width:28px;height:28px;border-radius:50%;cursor:pointer;">✕</button>
          </div>
        </div>

        <!-- Messages Area -->
        <div id="havoc-chat-messages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;background:rgba(0,0,0,0.2);">
          <div style="align-self:flex-start;max-width:85%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:12px 16px;border-radius:16px 16px 16px 4px;font-size:13px;line-height:1.5;">
            ${welcomeMsg}
            ${creatorChips}
          </div>
        </div>

        <!-- Attachment Previews Container -->
        <div id="havoc-chat-previews" style="display:none;padding:8px 20px;background:rgba(255,255,255,0.04);border-top:1px solid rgba(255,255,255,0.08);gap:8px;overflow-x:auto;"></div>

        <!-- Composer / Input Area -->
        <div style="padding:14px 20px;border-top:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);">
          <form id="havoc-chat-form" style="display:flex;align-items:center;gap:10px;">
            <input type="file" id="havoc-chat-file-picker" multiple style="display:none;" />
            <button type="button" id="havoc-chat-attach-btn" title="Attach file (Images, Video, Audio, Docs, Project Files)" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
              📎
            </button>
            <textarea id="havoc-chat-input" rows="1" placeholder="Type a message or brief (Shift+Enter for newline)..." style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:10px 14px;color:#fff;font-size:13px;resize:none;outline:none;font-family:inherit;line-height:1.4;max-height:80px;"></textarea>
            <button type="submit" id="havoc-chat-send-btn" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;padding:0 18px;height:38px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0;">
              Send
            </button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('havoc-chat-close-btn').onclick = () => {
      modal.style.display = 'none';
    };
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };

    // New Chat
    document.getElementById('havoc-new-chat-btn').onclick = () => {
      activeConversationId = 'conv-' + Date.now();
      pendingAttachments = [];
      renderAttachmentPreviews();
      const messagesContainer = document.getElementById('havoc-chat-messages');
      messagesContainer.innerHTML = `
        <div style="align-self:flex-start;max-width:85%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:12px 16px;border-radius:16px 16px 16px 4px;font-size:13px;line-height:1.5;">
          Started a new conversation! Attach files or describe your campaign brief.
        </div>
      `;
    };

    // Attachments Handling
    const filePicker = document.getElementById('havoc-chat-file-picker');
    document.getElementById('havoc-chat-attach-btn').onclick = () => {
      filePicker.click();
    };

    filePicker.onchange = (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 50MB limit.`);
          continue;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          pendingAttachments.push({
            name: file.name,
            filename: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            mediaType: file.type || 'application/octet-stream',
            dataUrl: event.target.result
          });
          renderAttachmentPreviews();
        };
        reader.readAsDataURL(file);
      }
      filePicker.value = '';
    };

    // Send Form
    const chatForm = document.getElementById('havoc-chat-form');
    const chatInput = document.getElementById('havoc-chat-input');

    // Quick chip buttons
    document.querySelectorAll('.havoc-quick-chip').forEach(btn => {
      btn.onclick = () => {
        chatInput.value = btn.getAttribute('data-prompt') || '';
        chatForm.dispatchEvent(new Event('submit'));
      };
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    chatForm.onsubmit = async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text && pendingAttachments.length === 0) return;

      chatInput.value = '';
      const attachmentsToSend = [...pendingAttachments];
      pendingAttachments = [];
      renderAttachmentPreviews();

      // Render User Message
      appendMessage('user', text, attachmentsToSend);

      // Create Assistant Placeholder
      const assistantMsgEl = appendMessage('assistant', 'Analyzing your request and database of verified AI creators...');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConversationId,
            message: text,
            attachments: attachmentsToSend,
            userRole: currentUser ? currentUser.role : 'brand',
            creatorName: currentUser ? currentUser.full_name : ''
          })
        });

        if (!res.body) {
          assistantMsgEl.textContent = 'Received response from AI assistant.';
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        assistantMsgEl.textContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text-delta' && data.delta) {
                  fullText += data.delta;
                  assistantMsgEl.innerHTML = formatMarkdown(fullText);
                  document.getElementById('havoc-chat-messages').scrollTop = document.getElementById('havoc-chat-messages').scrollHeight;
                }
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        assistantMsgEl.textContent = 'Sorry, encountered an error processing your chat message: ' + err.message;
      }
    };
  }

  function renderAttachmentPreviews() {
    const container = document.getElementById('havoc-chat-previews');
    if (!container) return;
    if (pendingAttachments.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }
    container.style.display = 'flex';
    container.innerHTML = pendingAttachments.map((att, idx) => `
      <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);padding:4px 8px;border-radius:10px;font-size:11px;white-space:nowrap;">
        <span>${att.type.includes('image') ? '🖼️' : att.type.includes('video') ? '🎥' : att.type.includes('audio') ? '🎵' : '📄'}</span>
        <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">${att.name}</span>
        <button onclick="removePendingAttachment(${idx})" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:11px;">✕</button>
      </div>
    `).join('');
  }

  window.removePendingAttachment = function(idx) {
    pendingAttachments.splice(idx, 1);
    renderAttachmentPreviews();
  };

  function appendMessage(role, text, attachments = []) {
    const container = document.getElementById('havoc-chat-messages');
    const msg = document.createElement('div');
    const isUser = role === 'user';
    msg.style.cssText = isUser
      ? 'align-self:flex-end;max-width:85%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 16px;border-radius:16px 16px 4px 16px;font-size:13px;line-height:1.5;box-shadow:0 4px 12px rgba(99,102,241,0.2);'
      : 'align-self:flex-start;max-width:85%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:12px 16px;border-radius:16px 16px 16px 4px;font-size:13px;line-height:1.5;';

    let contentHtml = '';
    if (attachments.length > 0) {
      contentHtml += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">';
      for (const att of attachments) {
        contentHtml += `<span style="font-size:11px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.2);padding:2px 6px;border-radius:6px;">📎 ${att.name || att.filename}</span>`;
      }
      contentHtml += '</div>';
    }
    contentHtml += isUser ? escapeHtml(text) : formatMarkdown(text);
    msg.innerHTML = contentHtml;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)\n/g, '<h4 style="margin:8px 0 4px;font-size:13px;font-weight:700;color:#c084fc;">$1</h4>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function updateAuthHeader() {
    let currentUser = null;
    try {
      const u = localStorage.getItem('havoc_user');
      if (u) currentUser = JSON.parse(u);
    } catch (e) {}
    if (!currentUser) return;

    const authContainer = document.querySelector('header .glass.flex.items-center.gap-1.rounded-2xl.p-1\\.5');
    if (authContainer) {
      const targetUrl = currentUser.role === 'creator' ? '/studio' : '/brand';
      authContainer.innerHTML = `
        <a class="inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 text-xs rounded-xl" href="${targetUrl}">
          <span style="width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block;"></span>
          ${escapeHtml(currentUser.full_name)}
        </a>
        <button id="havoc-logout-btn" class="inline-flex items-center justify-center whitespace-nowrap font-medium cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-2.5 text-xs text-muted-foreground" title="Sign out">
          Sign out
        </button>
      `;
      document.getElementById('havoc-logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('havoc_user');
        localStorage.removeItem('havoc_role');
        window.location.reload();
      });
    }
  }

  // Auto-inject once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectWidget();
      updateAuthHeader();
    });
  } else {
    injectWidget();
    updateAuthHeader();
  }

  // Pre-load synth voices
  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {};
  }
})();
