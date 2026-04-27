/// REQUIRELANDIA ///
const { puto, consejo, poema, zabaleta, dato, chiste, levelup, msj } = require('../../RESPUESTAS');
const {
  respuestas,
  respuestas2,
  demostradas,
  usuarios,
  esperandoRespuesta,
  MARGEN_MENSAJES,
  mixages,
  obtenerNombre
} = require('./MIXAGES');

function mezclar(clave, lista) {
  if (!lista || lista.length === 0) return null;

  if (!mixages[clave] || mixages[clave].length === 0) {
    mixages[clave] = [...lista];
  }

  const numero = Math.floor(Math.random() * mixages[clave].length);
  const resultado = mixages[clave][numero];

  mixages[clave].splice(numero, 1);

  return resultado;
};

module.exports = [

{
/// !PUTO ///
name: "puto",

async ejecutar(message) {

const nombre = obtenerNombre(message.sender);

let usuario = null;

for (const key of Object.keys(puto)) {

if (key === "Todos") continue;

if (nombre.toLowerCase().includes(key.toLowerCase())) {
usuario = key;
break;
}

}

const Generales = puto["Todos"];
const Propias = usuario && puto[usuario] ? puto[usuario] : [];

const usarPropia = Propias.length > 0 && Math.random() < 0.5;

const lista = usarPropia ? Propias : Generales;
const clave = usarPropia ? usuario : "Todos";

const texto = mezclar(clave, lista);

message.reply(texto);
},
},

{
/// !CONSEJO ///
name: "consejo",

ejecutar(message) {

const texto = mezclar("consejo", consejo);
message.reply(texto);

if (texto === "No me disparen, soy imbécil") {

const key = message.chatId + "_" + message.sender;

esperandoRespuesta[key] = {
restante: MARGEN_MENSAJES,
tipo: "consejo"
};

}

},

detectarRespuesta(message) {

const key = message.chatId + "_" + message.sender;

if (!esperandoRespuesta[key]) return;

const contenido = message.body.toLowerCase();

const coincide = respuestas2.some(r => contenido.includes(r));

if (coincide) {

const randomFrase =
demostradas[Math.floor(Math.random() * demostradas.length)];

message.reply(randomFrase);

delete esperandoRespuesta[key];
return;

}

esperandoRespuesta[key].restante--;

if (esperandoRespuesta[key].restante <= 0) {
delete esperandoRespuesta[key];
}

}
},

{
/// !POEMA ///
name: "poema",

ejecutar(message) {

const texto = mezclar("poema", poema);
message.reply(texto);

if (texto === "¿Es cierto?") {

const key = message.chatId + "_" + message.sender;

esperandoRespuesta[key] = {
restante: MARGEN_MENSAJES,
tipo: "poema"
};

}

},

detectarRespuesta(message) {

const key = message.chatId + "_" + message.sender;
const contenido = message.body.toLowerCase();

if (esperandoRespuesta[key]) {

const coincide = respuestas.some(r => contenido.includes(r));

if (coincide) {

message.reply("QUE TE CAGASTE EN EL DESIERTO 🗣🔥🗣🔥");

delete esperandoRespuesta[key];
return;

}

}

for (const id in esperandoRespuesta) {

esperandoRespuesta[id].restante--;

if (esperandoRespuesta[id].restante <= 0) {
delete esperandoRespuesta[id];
}

}

}
},

{
/// !ZABALETA ///
name: "zabaleta",

ejecutar(message) {

const texto = mezclar("zabaleta", zabaleta);
message.reply(texto);

}
},

{
/// !DATO ///
name: "dato",

ejecutar(message) {

const texto = mezclar("dato", dato);
message.reply(texto);

}
},

{
/// !CHISTE ///
name: "chiste",

ejecutar(message) {

const texto = mezclar("chiste", chiste);
message.reply(texto);

},
},

{
/// !LEVELUP ///
name: "levelup",

async ejecutar(message, NewLevel) {

let texto = mezclar("levelup", levelup);

const nombre = obtenerNombre(message.sender);

texto = texto
.replace(/\${NewLevel}/g, NewLevel)
.replace(/\${message\.author}/g, nombre);

message.reply(texto);

}
},

{
/// !MSJ ///
name: "msj",

async ejecutar(message, ID) {

let texto = mezclar("msj", msj);

const nombre = obtenerNombre(message.sender);

texto = texto
.replace(/\${ID\.MensajesEnviados}/g, ID.MensajesEnviados)
.replace(/\${message\.author\.name}/g, nombre)
.replace(/\${message\.author}/g, nombre);

message.reply(texto);

},
},

{
/// HELP ///
name: "help",

ejecutar(message) {

message.reply(`COMANDOS:
--- NORMALES ---
!puto
!consejo
!poema
!dato
!zabaleta
!chiste
--- RANGOS/NIVELES ---
!rank (tu nivel)
!msj (cantidad de mensajes enviados)
--- COMANDOS PERSONALIZADOS ---
!addconsejo
!addpoema
!adddato
!addzabaleta
!addchiste
--- !addputo ---
!addputo.Todos
!addputo.Walter
!addputo.Maty
!addputo.Quagmire de la Saladix (Muñoz)
!addputo.Techo de chapa (Michau)
!addputo.Judas (Ayrton)
!addputo.Yo 🗿 (Uriel)
--- AYUDA ---
!help`)
}
}

];
