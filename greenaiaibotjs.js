let conversationHistory = [];
let db;
let dbReady = new Promise((resolve, reject) => {
  const req = indexedDB.open("GreenBotDB", 1);
  req.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("chats")) {
      db.createObjectStore("chats", { keyPath: "id", autoIncrement: true });
    }
  };
  req.onsuccess = e => { db = e.target.result; resolve(); };
  req.onerror = e => reject(e);
});

// ===== Save to IndexedDB =====
function saveChat(userOriginal, userEnglish, botEnglish, botTranslated) {
  return new Promise(async (resolve) => {
    await dbReady;
    const tx = db.transaction("chats", "readwrite");
    tx.objectStore("chats").add({
      userOriginal,
      userEnglish,
      botEnglish,
      botTranslated,
      timestamp: new Date()
    });
    tx.oncomplete = () => resolve();
  });
}

// ===== Load from IndexedDB =====
async function loadChats() {
  await dbReady;
  const tx = db.transaction("chats", "readonly");
  const store = tx.objectStore("chats");
  const req = store.getAll();
  req.onsuccess = () => {
    const chats = req.result;
    result.innerHTML = "";
    conversationHistory = [];

    chats.forEach(c => {
      result.innerHTML += `<p><strong>You:</strong> ${c.userOriginal}<br><strong>Bot:</strong> ${c.botTranslated}</p>`;
      conversationHistory.push({ role: "user", text: c.userEnglish });
      conversationHistory.push({ role: "model", text: c.botEnglish });
    });

    result.scrollTop = result.scrollHeight;
  };
}

const AI_API_KEY = "AIzaSyC5ab-HZmvtoTEXMRBMb4-tPpwD2yMVF1A";
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("sendBtn");
const result = document.getElementById("result");

// ===== Show login details =====
function showLoginDetails() {
  const username = localStorage.getItem("username") || "Guest";
  const email = localStorage.getItem("email") || "Not Provided";
  document.getElementById("login-details").innerHTML =
    `<strong>${username}</strong><br><small>${email}</small>`;
}
window.addEventListener("load", showLoginDetails);

// ===== Google Translate API (free endpoint) =====
async function translateText(text, targetLang) {
  if (!text || targetLang === "en") return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map(item => item[0]).join('');
  } catch (e) {
    return text;
  }
}

function getSelectedLanguage() {
  const combo = document.querySelector('.goog-te-combo');
  if (combo && combo.value) return combo.value;
  return "en";
}

// ===== Send Message to Gemini =====
async function sendMessage() {
  const val = userInput.value.trim();
  if (!val) {
    result.innerHTML += `<p style="color:red;"><strong>You:</strong> Enter a message</p>`;
    result.scrollTop = result.scrollHeight;
    return;
  }

  localStorage.removeItem("draftMessage");

  result.innerHTML += `<p><strong>You:</strong> ${val}</p>`;
  userInput.value = "";
  result.scrollTop = result.scrollHeight;

  try {
    const lang = getSelectedLanguage();
    const inputInEnglish = lang === "en" ? val : await translateText(val, "en");
    conversationHistory.push({ role: "user", text: inputInEnglish });

    const loadingMsg = document.createElement("p");
    loadingMsg.innerHTML = "<em>Bot is thinking...</em>";
    result.appendChild(loadingMsg);
    result.scrollTop = result.scrollHeight;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: conversationHistory.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }))
        })
      }
    );
    const data = await response.json();
    let outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    conversationHistory.push({ role: "model", text: outputText });

    let translatedOutput = lang === "en" ? outputText : await translateText(outputText, lang);

    loadingMsg.innerHTML = `<strong>Bot:</strong><br>` + marked.parse(translatedOutput);
    result.scrollTop = result.scrollHeight;

    // 🔊 Speak the translated response
    speakText(translatedOutput, lang === "en" ? "en-US" : lang);

    // Save full chat details
    saveChat(val, inputInEnglish, outputText, translatedOutput);

  } catch (e) {
    result.innerHTML += `<p style='color:red;'>Error: ${e.message}</p>`;
    result.scrollTop = result.scrollHeight;
  }
}

// ===== Events =====
sendBtn.onclick = sendMessage;
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

userInput.addEventListener("input", () => {
  localStorage.setItem("draftMessage", userInput.value);
});
window.addEventListener("load", () => {
  const draft = localStorage.getItem("draftMessage");
  if (draft) userInput.value = draft;
});

dbReady.then(loadChats);

// ===== Speech Synthesis =====
async function speakText(text, lang = "en-US") {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis not supported in this browser.");
      return resolve();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = resolve;
    window.speechSynthesis.speak(utterance);
  });
}
