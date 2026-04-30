/* ============================================================
   SASTRA Chat Widget – multi-language, FAQ bot
   ============================================================ */
(function () {
  const triggerContainer = document.getElementById('chat-trigger-container');
  const chatWindow       = document.getElementById('chat-window');
  const closeChat        = document.getElementById('close-chat');

  if (!triggerContainer || !chatWindow || !closeChat) return;

  triggerContainer.addEventListener('click', () => {
    const isOpen = chatWindow.style.display === 'flex';
    chatWindow.style.display = isOpen ? 'none' : 'flex';
    triggerContainer.style.transform = 'scale(0.9)';
    setTimeout(() => (triggerContainer.style.transform = 'scale(1)'), 150);
  });

  closeChat.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  /* Language configs – page lang attr drives selection */
  const langConfig = {
    en: {
      ringText:        ' • AI BUDDY • FAQ HELP • AI BUDDY • FAQ HELP ',
      title:           'Admission Assistant',
      welcome:         'Hello! I am your AI Admission Assistant. What is your name?',
      personalWelcome: (name) => `Nice to meet you ${name}! 😊 What would you like to know about admissions 2026?`,
      placeholder:     'Type your query...',
      send:            'Send',
      fallback:        "That's a great question! Right now I can help with common admission FAQs for 2026. For more specific updates, visit www.sastra.edu or write to admissions@sastra.ac.in 😊",
    },
    ta: {
      ringText:        ' • AI உதவியாளர் • கேள்வி பதில் • AI உதவியாளர் • கேள்வி பதில் ',
      title:           'சேர்க்கை உதவி',
      welcome:         'வணக்கம்! நான் உங்கள் AI சேர்க்கை உதவியாளர். உங்கள் பெயர் என்ன?',
      personalWelcome: (name) => `உங்களைச் சந்தித்ததில் மகிழ்ச்சி ${name}! 😊 2026 சேர்க்கை பற்றி என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?`,
      placeholder:     'கேள்வியைத் தட்டச்சு செய்க...',
      send:            'அனுப்பு',
      fallback:        'தற்போது 2026 ஆம் ஆண்டிற்கான பொதுவான சேர்க்கை கேள்விகளுக்கு உதவ முடியும். கூடுதல் விவரங்களுக்கு www.sastra.edu ஐப் பார்க்கவும் 😊',
    },
    te: {
      ringText:        ' • AI సహాయకుడు • ప్రశ్నోత్తరాలు • AI సహాయకుడు • ప్రశ్నోత్తరాలు ',
      title:           'అడ్మిషన్ సహాయకుడు',
      welcome:         'నమస్కారం! నేను మీ AI అడ్మిషన్ సహాయకుడిని. మీ పేరు ఏమిటి?',
      personalWelcome: (name) => `మిమ్మల్ని కలవడం సంతోషంగా ఉంది ${name}! 😊 2026 అడ్మిషన్ల గురించి ఏమి తెలుసుకోవాలనుకుంటున్నారు?`,
      placeholder:     'ఇక్కడ టైప్ చేయండి...',
      send:            'పంపండి',
      fallback:        'ప్రస్తుతం నేను 2026 అడ్మిషన్ల గురించి మాత్రమే సహాయం చేయగలను. మరిన్ని వివరాల కోసం www.sastra.edu ని సందర్శించండి 😊',
    },
    hi: {
      ringText:        ' • AI सहायक • सामान्य प्रश्न • AI सहायक • सामान्य प्रश्न ',
      title:           'प्रवेश सहायक',
      welcome:         'नमस्ते! मैं आपका AI प्रवेश सहायक हूँ। आपका नाम क्या है?',
      personalWelcome: (name) => `आपसे मिलकर अच्छा लगा ${name}! 😊 आप 2026 प्रवेश के बारे में क्या जानना चाहते हैं?`,
      placeholder:     'अपना प्रश्न लिखें...',
      send:            'भेजें',
      fallback:        'अभी मैं केवल 2026 के सामान्य प्रवेश प्रश्नों में मदद कर सकता हूँ। अधिक जानकारी के लिए www.sastra.edu पर जाएं 😊',
    },
  };

  const currentLang = document.documentElement.lang || 'en';
  const config      = langConfig[currentLang] || langConfig.en;

  /* Apply language config */
  const titleEl    = document.getElementById('chat-title');
  const welcomeEl  = document.getElementById('bot-welcome');
  const inputEl    = document.getElementById('user-input');
  const sendBtn    = document.getElementById('send-btn');
  const circleText = document.getElementById('circle-text');

  if (titleEl)    titleEl.innerText              = config.title;
  if (welcomeEl)  welcomeEl.innerText            = config.welcome;
  if (inputEl)    inputEl.placeholder            = config.placeholder;
  if (sendBtn)    sendBtn.innerText              = config.send;
  if (circleText) circleText.textContent         = config.ringText;

  let userName = '';

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

  function sendMessage() {
    const msg = inputEl.value.trim();
    if (!msg) return;

    const chatMessages = document.getElementById('chat-messages');

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble--user';
    userBubble.innerText = msg;
    chatMessages.appendChild(userBubble);

    setTimeout(() => {
      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble chat-bubble--bot';

      if (!userName) {
        userName = msg;
        botBubble.innerText = config.personalWelcome(userName);
      } else {
        const lower = msg.toLowerCase();
        if (
          lower.includes('date') ||
          msg.includes('தேதி') ||
          msg.includes('తేదీ') ||
          msg.includes('तारीख')
        ) {
          botBubble.innerText =
            'Application process starts on March 27, 2026. Phase I Admissions start from April 19, 2026.';
        } else {
          botBubble.innerText = config.fallback;
        }
      }

      chatMessages.appendChild(botBubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 400);

    inputEl.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
})();
