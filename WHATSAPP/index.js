const path = require("path");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-zygote',
      '--single-process'
    ]
  }
});

client.on("qr", qr => { qrcode.generate(qr, { small: true }); });
client.on("ready", () => { console.log("Bot conectado a WhatsApp"); });

/// COMANDOS ///
const comandosArray = require('./Comandos/REQUIRES.js');
const rtas = require(path.join(__dirname, '../RESPUESTAS.json'));

const comandos = {};
for (const cmd of comandosArray) {
  comandos[cmd.name] = cmd;
}
const llave = Object.keys(comandos);

/// IMAGENES LOCALES ///
const rutasImagen = {
  "Muñoz": path.join(__dirname, "Images/Quag"),
  "Michau": path.join(__dirname, "Images/Techo"),
  "Uriel": path.join(__dirname, "Images/Yo"),
  "Walter": path.join(__dirname, "Images/Walt"),
  "Ayrton": path.join(__dirname, "Images/Judas"),
  "Maty": path.join(__dirname, "Images/Maty")
};

/// DATOS DEL USUARIO ///
const nombresNumero = {
  "5492634214467": "Ayrton",
  "5492634760758": "Maty",
  "5492634505197": "Muñoz",
  "5492634526318": "Michau",
  "5492634382707": "Walter",
  "5492634541947": "Uriel"
};

let usuarios = {};

/// Guardar respuestas ///
function SAVERTA() {
  fs.writeFile(
    path.join(__dirname, "../RESPUESTAS.json"),
    JSON.stringify(rtas, null, 2),
    err => { if (err) console.error(err); }
  );
}

/// Require mixages (ARREGLADO)
const { mixages } = require(path.join(__dirname, 'Comandos/MIXAGES'));

const imagenDefault = path.join(__dirname, "Images/default.jpg");

/// CONTROL PARA NO REPETIR IMAGENES
let imagenesUsadas = {};

function obtenerImagenAleatoria(carpeta) {

  if (!imagenesUsadas[carpeta]) {
    imagenesUsadas[carpeta] = [];
  }

  const archivos = fs.readdirSync(carpeta)
    .filter(f => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg"));

  const disponibles = archivos.filter(a => !imagenesUsadas[carpeta].includes(a));

  if (disponibles.length === 0) {
    imagenesUsadas[carpeta] = [];
    return obtenerImagenAleatoria(carpeta);
  }

  const elegido = disponibles[Math.floor(Math.random() * disponibles.length)];

  imagenesUsadas[carpeta].push(elegido);

  return path.join(carpeta, elegido);
}

/// LEVEL DATA ///
try {
  const data = fs.readFileSync(path.join(__dirname, "./level.json"), "utf8");
  usuarios = JSON.parse(data);
} catch { }
