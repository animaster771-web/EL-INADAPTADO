const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

/// COMANDOS ///
const comandosArray = require("./Comandos/REQUIRES.js");
const rtas = require("../RESPUESTAS.json");

const comandos = {};
for (const cmd of comandosArray) {
  comandos[cmd.name] = cmd;
}
const llave = Object.keys(comandos);

/// IMÁGENES ///
const rutasImagen = {
  "Muñoz": "Images/Quag",
  "Michau": "Images/Techo",
  "Uriel": "Images/Yo",
  "Walter": "Images/Walt",
  "Ayrton": "Images/Judas",
  "Maty": "Images/Maty"
};

const nombresNumero = {
  "5492634214467": "Ayrton",
  "5492634760758": "Maty",
  "5492634505197": "Muñoz",
  "5492634526318": "Michau",
  "5492634382707": "Walter",
  "5492634541947": "Uriel"
};

let usuarios = {};

/// 🔥 CARGAR Y MIGRAR USUARIOS
try {
  const data = JSON.parse(fs.readFileSync("./level.json"));

  for (const key in data) {

    const nuevoId = key
      .replace("@c.us", "@s.whatsapp.net");

    usuarios[nuevoId] = data[key];
  }

} catch {}

/// GUARDAR RESPUESTAS
function SAVERTA() {
  fs.writeFileSync("../RESPUESTAS.json", JSON.stringify(rtas, null, 2));
}

/// CONTROL IMÁGENES
let imagenesUsadas = {};

function obtenerImagenAleatoria(carpeta) {
  if (!imagenesUsadas[carpeta]) imagenesUsadas[carpeta] = [];

  const archivos = fs.readdirSync(carpeta)
    .filter(f => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg"));

  const disponibles = archivos.filter(a => !imagenesUsadas[carpeta].includes(a));

  if (disponibles.length === 0) {
    imagenesUsadas[carpeta] = [];
    return obtenerImagenAleatoria(carpeta);
  }

  const elegido = disponibles[Math.floor(Math.random() * disponibles.length)];
  imagenesUsadas[carpeta].push(elegido);

  return `${carpeta}/${elegido}`;
}

/// SOCKET
async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {

    if (connection === "close") {

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) startBot();

    } else if (connection === "open") {

      console.log("✅ Bot conectado con Baileys");

    }

  });

  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    /// FILTROS IMPORTANTES
    if (sender === "status@broadcast") return;
    if (sender.includes("@lid")) return;
    if (sender.includes("@bot")) return;

    const contenido =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!contenido) return;

    /// CREAR USUARIO
    if (!usuarios[sender]) {
      usuarios[sender] = {
        MensajesEnviados: 0,
        XP: 0,
        LastXP: 0,
        Level: 0
      };
    }

    const ID = usuarios[sender];

    /// WRAPPER (simula whatsapp-web.js)
    const message = {
      body: contenido.toLowerCase(),
      sender: sender,
      chatId: from,
      reply: (txt) => sock.sendMessage(from, { text: txt })
    };

    /// RESPUESTAS INTERACTIVAS
    ["poema", "consejo"].forEach(c => {
      try {
        comandos[c]?.detectarRespuesta?.(message);
      } catch {}
    });

    /// COMANDOS
    const comando = llave.find(c => message.body.includes("!" + c));

    if (comando) {
      try {
        await comandos[comando].ejecutar(message, ID);
      } catch (err) {
        console.log("Error comando:", err);
      }
    }

    /// SISTEMA XP
    const ya = Date.now();

    ID.MensajesEnviados++;

    if (ya - ID.LastXP >= 60000) {
      ID.XP += Math.floor(Math.random() * 15 + 10);
      ID.LastXP = ya;
    }

    let xpNecesaria = 5 * ID.Level ** 2 + 50 * ID.Level + 100;

    if (ID.XP >= xpNecesaria) {
      ID.Level++;

      try {
        await comandos["levelup"].ejecutar(message, ID.Level);
      } catch {}
    }

    /// RANK
    if (message.body.includes("!rank")) {

      const userId = sender;
      const ID = usuarios[userId];

      if (!ID) {
        message.reply("Ese usuario no tiene XP.");
        return;
      }

      let xpNecesaria = 5 * ID.Level ** 2 + 50 * ID.Level + 100;
      let porcentaje = ID.XP / xpNecesaria;
      if (porcentaje > 1) porcentaje = 1;

      const canvas = createCanvas(934, 282);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#23272A";
      ctx.fillRect(0, 0, 934, 282);

      const numero = sender.split("@")[0];
      const nombreFinal = nombresNumero[numero] || "Usuario";

      let avatar;

      try {
        if (rutasImagen[nombreFinal]) {
          avatar = await loadImage(obtenerImagenAleatoria(rutasImagen[nombreFinal]));
        } else {
          avatar = await loadImage("Images/default.jpg");
        }
      } catch {
        avatar = await loadImage("Images/default.jpg");
      }

      ctx.beginPath();
      ctx.arc(140, 141, 80, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(avatar, 60, 60, 160, 160);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 38px Arial";
      ctx.fillText(nombreFinal, 270, 115);

      ctx.fillStyle = "#ED4245";
      ctx.fillRect(270, 190, 550 * porcentaje, 25);

      const buffer = canvas.toBuffer("image/png");

      await sock.sendMessage(from, {
        image: buffer,
        caption: "🏆 Tu rango"
      });
    }

  });

  /// GUARDADO AUTOMÁTICO
  setInterval(() => {
    fs.writeFileSync("./level.json", JSON.stringify(usuarios, null, 2));
  }, 30000);
}

startBot();
