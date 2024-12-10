import { GoogleGenerativeAI } from "@google/generative-ai";
import MarkdownIt from "markdown-it";
import { maybeShowApiKeyBanner } from "../gemini-api-banner.js";


// 🔥 Llave API de Gemini
let API_KEY = "AIzaSyCsVbuMvKw7JdCkjGwBtRiP-AVf45fWMm8";

// Referencias al DOM
const input = document.getElementById("user-input");
const submitBtn = document.getElementById("submit-btn");
const chatOutput = document.querySelector(".chat-output");
const instructions = document.querySelector(".instructions");

// Estado del flujo
let step = 0;
let userName = "";
let debateTopic = "";

// Manejador del botón
submitBtn.onclick = async () => {
  let userInput = input.value.trim();
  if (!userInput) return;

  input.value = "";

  // Flujo del chat
  switch (step) {
    case 0: // Pedir nombre
      userName = userInput;
      instructions.textContent = `Hola, ${userName}. ¿Sobre qué tema filosófico te gustaría debatir?`;
      step++;
      break;

    case 1: // Elegir tema
      debateTopic = userInput;
      instructions.textContent = `¡Perfecto! Inicia el debate diciendo tu argumento sobre "${debateTopic}".`;
      addMessage("IA", `Iniciemos el debate sobre "${debateTopic}".`);
      step++;
      break;

    case 2: // Argumento del usuario e IA responde
      addMessage(userName, userInput);
      await generateDebateResponse(userInput);
      break;
  }
};

// Agregar mensajes al chat
function addMessage(sender, message) {
  let messageElement = document.createElement("div");
  messageElement.className = "message";
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatOutput.appendChild(messageElement);
  chatOutput.scrollTop = chatOutput.scrollHeight; // Desplazarse hacia abajo
}

// Generar respuesta de la IA
async function generateDebateResponse(userArgument) {
  addMessage("IA", "Analizando tu argumento...");
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const contents = [
      {
        role: "user",
        parts: [{ text: `¿El argumento "${userArgument}" es válido para el debate sobre ${debateTopic}? Da un razonamiento claro.` }],
      },
    ];

    const result = await model.generateContentStream({ contents });
    let buffer = [];
    let md = new MarkdownIt();

    for await (let response of result.stream) {
      buffer.push(response.text());
    }

    const responseText = buffer.join("");
    const formattedResponse = md.render(responseText);

    addMessage("IA", formattedResponse);
  } catch (e) {
    addMessage("IA", "Hubo un error al generar la respuesta. Intenta nuevamente.");
  }
}

// Mostrar banner si no se ha configurado la API key
maybeShowApiKeyBanner(API_KEY);
