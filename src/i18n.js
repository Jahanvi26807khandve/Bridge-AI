const resultTranslations = {
  english: {
    summary: 'Summary',
    whoItAffects: 'Who it affects',
    deadlines: 'Deadlines',
    actionSteps: 'What you should do',
    copySummary: 'Copy summary',
    print: 'Print',
    readAloud: 'Read aloud',
    noVoice: 'No voice for this language is installed on your device.',
    simplifyAnotherNotice: 'Simplify another notice',
    disclaimer: 'This is a simplified explanation, not legal advice.',
    noActions: 'No action is requested in the notice.',
  },
  hindi: {
    summary: 'सारांश',
    whoItAffects: 'यह किसे प्रभावित करता है',
    deadlines: 'समय-सीमा',
    actionSteps: 'आपको क्या करना चाहिए',
    copySummary: 'सारांश कॉपी करें',
    print: 'प्रिंट करें',
    readAloud: 'ज़ोर से पढ़ें',
    noVoice: 'आपके डिवाइस पर इस भाषा की आवाज़ उपलब्ध नहीं है।',
    simplifyAnotherNotice: 'दूसरा नोटिस सरल करें',
    disclaimer: 'यह एक सरल व्याख्या है, कानूनी सलाह नहीं।',
    noActions: 'नोटिस में किसी कार्रवाई का अनुरोध नहीं किया गया है।',
  },
  marathi: {
    summary: 'सारांश',
    whoItAffects: 'कोणावर परिणाम होतो',
    deadlines: 'अंतिम मुदत',
    actionSteps: 'तुम्ही काय करावे',
    copySummary: 'सारांश कॉपी करा',
    print: 'प्रिंट करा',
    readAloud: 'मोठ्याने वाचा',
    noVoice: 'तुमच्या डिव्हाइसवर या भाषेसाठी आवाज उपलब्ध नाही.',
    simplifyAnotherNotice: 'दुसरी सूचना सोपी करा',
    disclaimer: 'हे सोपे स्पष्टीकरण आहे, कायदेशीर सल्ला नाही.',
    noActions: 'सूचनेत कोणतीही कृती करण्यास सांगितलेले नाही.',
  },
}

export function getResultText(language, key) {
  const selectedTranslations =
    resultTranslations[typeof language === 'string' ? language.toLowerCase() : ''] ??
    resultTranslations.english

  return selectedTranslations[key] ?? resultTranslations.english[key] ?? key
}

export function getResultLanguageCode(language) {
  const codes = { english: 'en', hindi: 'hi', marathi: 'mr' }
  return codes[typeof language === 'string' ? language.toLowerCase() : ''] ?? 'en'
}
