const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js"); 
const qrcode = require("qrcode-terminal"); 
const fs = require("fs"); 
const { createCanvas, loadImage } = require("canvas"); 
const client = new Client({ authStrategy: new LocalAuth() }); 
client.on("qr", qr => { qrcode.generate(qr, { small: true }); }); 
client.on("ready", () => { console.log("Bot conectado a WhatsApp"); });

/// COMANDOS ///
const comandosArray = require('./Comandos/REQUIRES.js');
const rtas = require('../RESPUESTAS.json');

const comandos = {};
for (const cmd of comandosArray) {
  comandos[cmd.name] = cmd;
}
const llave = Object.keys(comandos);

/// IMAGENES LOCALES ///
const rutasImagen = {
  "Muñoz": "Images/Quag",
  "Michau": "Images/Techo",
  "Uriel": "Images/Yo",
  "Walter": "Images/Walt",
  "Ayrton": "Images/Judas",
  "Maty": "Images/Maty"
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
    "../RESPUESTAS.json",
    JSON.stringify(rtas, null, 2),
    err => { if (err) console.error(err); }
  );
}

/// Require mixages ///
const { mixages } = require('./Comandos/MIXAGES.js');
const imagenDefault = "Images/default.jpg";


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

  return `${carpeta}/${elegido}`;
}

/// LEVEL DATA ///
try {
  const data = fs.readFileSync("./level.json", "utf8");
  usuarios = JSON.parse(data);
} catch { }


client.on("message", async (message) => {

  if (message.fromMe) return;

  /// DATOS DE USUARIO ///
  const contacto = await message.getContact();


  let userId = contacto.id._serialized;
  let numero = contacto.number;
  let nombre = contacto.pushname || contacto.name || numero;


  if (!usuarios[userId]) {
    usuarios[userId] = {
      MensajesEnviados: 0,
      XP: 0,
      LastXP: 0,
      Level: 0
    };

  }
  const ID = usuarios[userId];

  /// NOW ///
  const ya = Date.now();
  const contenido = (message.body || "").toLowerCase();

  /// RESPUESTAS INTERACTIVAS ///
  ["poema", "consejo"].forEach(c => {
    try {
      if (comandos[c]?.detectarRespuesta) {
        comandos[c].detectarRespuesta(message);
      }
    } catch (err) {
      console.log(`Error ${c}:`, err);
    }
  });

  /// COMANDOS ///
  const comando = llave.find(c => contenido.includes("!" + c));
  if (comando) {
    try {
      await comandos[comando].ejecutar(message, ID);
    } catch (err) {
      console.log("Error comando:", err);
    }
  }


  /// SISTEMA LEVEL CONTINÚA ///
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

    } catch (err) {

      console.log("Error levelup:", err);

    }

  }

  /// COMANDO RANK ///
  if (contenido.includes("!rank")) {

    let contact;

    /// DETECTAR USUARIO OBJETIVO
    if (message.hasQuotedMsg) {

      const quoted = await message.getQuotedMessage();
      contact = await quoted.getContact();

    } else if (message.mentionedIds.length) {

      contact = await client.getContactById(message.mentionedIds[0]);

    } else {

      contact = await message.getContact();

    }

    let userId = contact.id._serialized;
    let numero = contact.number;
    let nombre = contact.pushname || contact.name || numero;

    const ID = usuarios[userId];

    if (!ID) {
      message.reply("Ese usuario todavía no tiene XP.");
      return;
    }

    let xpNecesaria = 5 * ID.Level ** 2 + 50 * ID.Level + 100;
    let porcentaje = ID.XP / xpNecesaria;

    if (porcentaje > 1) porcentaje = 1;

    let ranking = Object.entries(usuarios)
      .sort((a, b) => b[1].XP - a[1].XP);

    let posicion = ranking.findIndex(user => user[0] === userId) + 1;


    /// CANVAS
    const canvas = createCanvas(934, 282);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#23272A";
    ctx.fillRect(0, 0, 934, 282);


    /// NOMBRE DEL CANVAS
    let nombreFinal = nombresNumero[numero] || "Usuario";


    /// AVATAR
    let avatar;

    try {

      if (rutasImagen[nombreFinal]) {

        const carpeta = rutasImagen[nombreFinal];
        const rutaImagen = obtenerImagenAleatoria(carpeta);

        avatar = await loadImage(rutaImagen);

      } else {

        avatar = await loadImage(imagenDefault);

      }

    } catch {

      avatar = await loadImage(imagenDefault);

    }


    /// AVATAR CIRCULAR
    ctx.save();

    ctx.beginPath();
    ctx.arc(140, 141, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const size = 160;
    const ratio = Math.max(size / avatar.width, size / avatar.height);

    const newWidth = avatar.width * ratio;
    const newHeight = avatar.height * ratio;

    const x = 140 - newWidth / 2;
    const y = 141 - newHeight / 2;

    ctx.drawImage(avatar, x, y, newWidth, newHeight);

    ctx.restore();


    /// TEXTO
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 38px Arial";
    ctx.fillText(nombreFinal, 270, 115);

    ctx.fillStyle = "#B9BBBE";
    ctx.font = "22px Arial";
    ctx.fillText(`${ID.XP} / ${xpNecesaria} XP`, 270, 155);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px Arial";
    ctx.fillText(`#${posicion}`, 790, 70);

    ctx.fillStyle = "#ED4245";
    ctx.font = "bold 45px Arial";
    ctx.fillText(`NIVEL ${ID.Level}`, 650, 120);


    /// BARRA XP
    ctx.fillStyle = "#2C2F33";
    ctx.fillRect(270, 190, 550, 25);

    ctx.fillStyle = "#ED4245";
    ctx.fillRect(270, 190, 550 * porcentaje, 25);


    const buffer = canvas.toBuffer("image/png");

    const media = new MessageMedia(
      "image/png",
      buffer.toString("base64"),
      "rank.png"
    );

    await message.reply(media);

  }

  /// COMANDO MENSAJES ///
  for (const rta of Object.keys(rtas)) {

    const prefix = "!add" + rta;

    if (contenido.startsWith(prefix)) {

      if (rta === "levelup" || rta === "msj") {
        message.reply("No podés modificar estos comandos, imbécil.");
        return;
      }

      // CASO ESPECIAL: puto
      if (rta === "puto") {

        const subcomandos = Object.keys(rtas.puto);

        let encontrado = null;

        for (const nombre of subcomandos) {

          const comando = (prefix + "." + nombre).toLowerCase();

          if (contenido.startsWith(comando)) {
            encontrado = nombre; // guardamos el nombre original
            break;
          }

        }

        if (!encontrado) {
          message.reply(
            `Así no se hace este comando, te muestro las formas de hacerlo:
!addputo.Todos
!addputo.Maty
!addputo.Walter
!addputo.Quagmire de la Saladix (Muñoz)
!addputo.Judas (Ayrton)
!addputo.Techo de chapa (Michau)
!addputo.Yo 🗿 (Uriel)`
          );
          return;
        }

        let CustomMessage = message.body
          .slice((prefix + "." + encontrado).length)
          .trim();

        if (CustomMessage.length === 0) {
          message.reply("Bah? Pero escribí algo morsa");
          return;
        }

        rtas.puto[encontrado].push(CustomMessage);

        message.reply(`✅ Respuesta añadida a puto.${encontrado}`);

        SAVERTA();

        break;
      }

      // COMANDOS NORMALES
      let CustomMessage = message.body.slice(prefix.length).trim();

      if (CustomMessage.length === 0) {
        message.reply("Bah? Pero escribí algo morsa");
        return;
      }

      rtas[rta].push(CustomMessage);

      if (!mixages[rta]) mixages[rta] = [];
      mixages[rta].push(CustomMessage);

      message.reply(`✅ Respuesta añadida a ${rta}`);

      SAVERTA();

      break;
    }

  }
});

/// SAVE ///
setInterval(() => {

  fs.writeFile(
    "./level.json",
    JSON.stringify(usuarios, null, 2),
    err => { if (err) console.error(err); }
  );
}, 30000);

client.initialize();
