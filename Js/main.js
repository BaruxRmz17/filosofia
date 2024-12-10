import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from '../gemini-api-banner';


// 🔥 Llave API de Gemini
let API_KEY = 'AIzaSyCsVbuMvKw7JdCkjGwBtRiP-AVf45fWMm8';

// Referencias al DOM
let input = document.getElementById("user-input");
let submitBtn = document.getElementById("submit-btn");
let output = document.querySelector('.output');
let instructions = document.querySelector('.instructions');
let philosopherImage = document.getElementById("philosopher-image");

// Estado del flujo
let step = 0; // Etapa del flujo
let userName = ""; // Nombre del usuario
let philosopher = ""; // Filósofo seleccionado

// Opciones de filósofos normalizadas
const philosophers = ["Sócrates", "Platón", "Aristóteles", "Nietzsche"];
const normalizedPhilosophers = philosophers.map(name => name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase());

// Manejador del botón de enviar
submitBtn.onclick = async () => {
  let userInput = input.value.trim();
  if (!userInput) return;

  // Limpiar entrada
  input.value = '';

  // Normalizar entrada
  let normalizedInput = userInput.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Flujo de interacción
  switch (step) {
    case 0: // Ingresar nombre
      userName = userInput;
      instructions.textContent = `Hola, ${userName}. ¿Sobre cuál de estos filósofos quieres aprender? (${philosophers.join(", ")})`;
      step++;
      break;

    case 1: // Elegir filósofo
      let index = normalizedPhilosophers.indexOf(normalizedInput);
      if (index !== -1) {
        philosopher = philosophers[index];
        instructions.textContent = `¡Excelente elección! Generando información sobre ${philosopher}...`;
        await generatePhilosopherInfo(philosopher);
        showPhilosopherImage(philosopher);
        instructions.textContent = `¿Qué más te gustaría aprender, ${userName}? Escribe "salir" para terminar.`;
        step++;
      } else {
        instructions.textContent = `Por favor, elige uno de los filósofos: ${philosophers.join(", ")}`;
      }
      break;

    case 2: // Continuar o salir
      if (normalizedInput === "salir") {
        instructions.textContent = `Gracias por usar la IA Filosófica, ${userName}. ¡Hasta pronto!`;
        input.disabled = true;
        submitBtn.disabled = true;
      } else {
        instructions.textContent = `Lo siento, ${userName}, no entiendo eso. Escribe "salir" si deseas terminar.`;
      }
      break;
  }
};

// Generar información sobre el filósofo
async function generatePhilosopherInfo(philosopher) {
  output.textContent = `Generando información sobre ${philosopher}...`;

  try {
    // Crear contenido para Gemini
    let contents = [
      {
        role: 'user',
        parts: [
          { text: `¿Qué puedo aprender sobre la corriente filosófica y vida de ${philosopher}?` }
        ]
      }
    ];

    // Llamar a la API de Gemini
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    // Mostrar la salida
    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }
  } catch (e) {
    output.innerHTML = `<hr>Error: ${e.message}`;
  }
}

// Mostrar imagen del filósofo
function showPhilosopherImage(philosopher) {
  let imageUrl = getPhilosopherImageUrl(philosopher);
  philosopherImage.src = imageUrl;
  philosopherImage.style.display = 'block';
}

// Obtener URL de la imagen del filósofo
function getPhilosopherImageUrl(philosopher) {
  switch (philosopher) {
    case "Sócrates":
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjw0lh9j2UP2wLn2Dy3G6VoHMD_Ba1jyGqT27iuEeNEhqUbvo4Wp_Haf7WXajBdLm_hDCducrJubn57OE3buQ7yA";
    case "Platón":
      return "https://www.filosofia.org/000/platon01.jpg";
    case "Aristóteles":
      return "https://www.worldhistory.org/img/r/p/500x600/1259.jpg?v=1667304423";
    case "Nietzsche":
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3kwRs-9pMoA-lEyH7Z5Yvle_LFV_EUKvXb9QiZwwEqpVwe16qnbrol7Yf0QTE-ZalngvLaNa4JEGE-jlnHYs3UQ";
    default:
      return "";
  }
}

// Mostrar banner si no se ha configurado la API key
maybeShowApiKeyBanner(API_KEY);
