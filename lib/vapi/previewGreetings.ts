/**
 * Preview-call greeting per language, so "Call me to preview" actually
 * demonstrates the voice in the language the business picked — not just
 * English regardless of what languages(Tamil/Hindi/Telugu/etc.) were
 * selected. Best-effort translations, not verified by a native speaker.
 */
export function previewGreeting(language: string, businessName: string): string {
  switch (language) {
    case "hi":
      return `नमस्ते! यह ${businessName} के AI रिसेप्शनिस्ट के लिए इस आवाज़ का एक नमूना है। आपके कॉलर यही सुनेंगे। आपका दिन शुभ हो!`;
    case "ta":
      return `வணக்கம்! இது ${businessName} நிறுவனத்தின் AI வரவேற்பாளருக்கான இந்தக் குரலின் மாதிரி. உங்கள் அழைப்பாளர்கள் இதைத்தான் கேட்பார்கள். நல்ல நாளாக அமையட்டும்!`;
    case "te":
      return `నమస్కారం! ఇది ${businessName} యొక్క AI రిసెప్షనిస్ట్ కోసం ఈ వాయిస్ నమూనా. మీ కాలర్‌లు ఇదే వింటారు. మీకు మంచి రోజు కావాలి!`;
    case "ml":
      return `നമസ്കാരം! ഇത് ${businessName}ന്റെ AI റിസപ്ഷനിസ്റ്റിനായുള്ള ഈ ശബ്ദത്തിന്റെ ഒരു സാമ്പിളാണ്. നിങ്ങളുടെ കോളർമാർ ഇതു തന്നെ കേൾക്കും. നല്ലൊരു ദിവസം ആശംസിക്കുന്നു!`;
    case "es":
      return `¡Hola! Esta es una vista previa de esta voz para el recepcionista de IA de ${businessName}. Esto es lo que escucharán tus clientes. ¡Que tengas un buen día!`;
    case "fr":
      return `Bonjour ! Ceci est un aperçu de cette voix pour le réceptionniste IA de ${businessName}. C'est ce que vos appelants entendront. Bonne journée !`;
    case "de":
      return `Hallo! Dies ist eine Vorschau dieser Stimme für den KI-Empfang von ${businessName}. Das werden Ihre Anrufer hören. Einen schönen Tag noch!`;
    case "it":
      return `Ciao! Questa è un'anteprima di questa voce per la receptionist AI di ${businessName}. Questo è ciò che sentiranno i tuoi chiamanti. Buona giornata!`;
    case "pt":
      return `Olá! Esta é uma prévia desta voz para a recepcionista de IA da ${businessName}. É isso que seus clientes vão ouvir. Tenha um ótimo dia!`;
    case "nl":
      return `Hallo! Dit is een voorproefje van deze stem voor de AI-receptionist van ${businessName}. Dit is wat je bellers zullen horen. Fijne dag nog!`;
    case "ru":
      return `Здравствуйте! Это демонстрация голоса для ИИ-администратора ${businessName}. Именно это услышат ваши звонящие. Хорошего дня!`;
    case "ja":
      return `こんにちは！これは${businessName}のAI受付の声のプレビューです。お客様にはこの声が聞こえます。良い一日を！`;
    case "en":
    default:
      return `Hi! This is a preview of this voice for ${businessName}'s AI receptionist. This is what your callers will hear. Have a great day!`;
  }
}
