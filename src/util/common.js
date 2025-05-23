import fs from 'fs';
import Discord from 'discord.js';
import { BOSS_DATA_DIRECTORY } from '../globals/constants.js';
import moment from 'moment-timezone';

// * Select the timezone
moment.tz.setDefault('Europe/Madrid');

// Función para convertir una hora específica (HH:MM) de Brasil a timestamp Unix en hora española
function getCustomTimeInUnix(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);

  // Crear la fecha/hora en timezone de São Paulo (Brasil) para HOY (ROLatam)
  let brasilTime = moment.tz('America/Sao_Paulo').set({
    hour: hours,
    minute: minutes,
    second: 0,
    millisecond: 0
  });
  // Si la hora proporcionada ya ha pasado hoy en Brasil, consideramos dos opciones:
  const nowInBrasil = moment.tz('America/Sao_Paulo');
  if (brasilTime.isBefore(nowInBrasil)) {
    // Si la diferencia es grande (más de 4 horas), asumimos que es para mañana
    if (nowInBrasil.diff(brasilTime, 'hours') > 4) {
      brasilTime.add(1, 'day');
    }
  }
   // Convertir a timezone de Madrid (España)
  const spainTime = brasilTime.clone().tz('Europe/Madrid');
  
  console.log(`Hora Brasil: ${brasilTime.format('HH:mm DD/MM')} -> Hora España: ${spainTime.format('HH:mm DD/MM')}`);
  
  return spainTime.unix();
}


// * parameters = time
// * returns a number separated with commas
export const addNumberWithCommas = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// * parameters = time
// * returns the converted seconds into minutes or hours
export const convertSecondstoHMS = (time) => {
  time = Number(time);
  var h = Math.floor(time / 3600);
  var m = Math.floor((time % 3600) / 60);
  var s = Math.floor((time % 3600) % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? ' hora ' : ' horas ') : '';
  var mDisplay = m > 0 ? m + (m == 1 ? ' minuto ' : ' minutos ') : '';
  var sDisplay = s > 0 ? s + (s == 1 ? ' segundo' : ' segundos') : '';
  return hDisplay + mDisplay + sDisplay;
};

export const removePrefix = (input, prefix) => input.replace(prefix, '').trim();
export const tokenizeInput = (input, prefix) => removePrefix(input, prefix).split(' ');

// * parameter = file name
// * returns parsed data
export const readFile = (filename) => {
  const data = fs.readFileSync(filename);
  const result = JSON.parse(data);
  return result;
};

// * parameters = user input
// * returns TRUE if boss alias is found in the db
export const checkAlias = (input) => {
  let isFound = false;
  let bossList = readFile(BOSS_DATA_DIRECTORY);

  for (let i = 0; i < bossList.bosses.length; i++) {
    for (let j = 0; j < bossList.bosses[i].alias.length; j++) {
      if (bossList.bosses[i].alias[j].toLowerCase() === input.toLowerCase().trim()) {
        isFound = true;
      }
    }
  }
  return isFound;
};

// * parameters = user input and its result checked by checkAlias()
// * returns TRUE if input is correct
export const checkInput = (input, checkAliasResult) => {
  let isValidInput = true;

  if (input.length < 3 && !checkAliasResult) {
    isValidInput = false;
  }
  return isValidInput;
};

// * parameters = boss info
// * returns embed with boss info
export const createBossInfoEmbed = ({
  bossName,
  HP,
  race,
  property,
  location,
  minRespawnTimeScheduleInSeconds,
  maxRespawnTimeScheduleInSeconds,
  imageUrl,
  alias,
}) => {
  const bossInfoEmbed = new Discord.MessageEmbed()
    .setColor('#0xD8BFDD')
    .setTitle(bossName)
    .setDescription(`**Alias:** ${alias.join(', ')}`)
    .setThumbnail(imageUrl)
    .addFields(
      { name: 'HP', value: addNumberWithCommas(HP) || '--' },
      { name: 'Ubicación', value: location || '--' },
      { name: 'Raza', value: race || '--', inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: 'Tipo', value: property || '--', inline: true },
      {
        name: 'Min. Respawn',
        value: convertSecondstoHMS(minRespawnTimeScheduleInSeconds) || '--',
        inline: true,
      },
      { name: '\u200B', value: '\u200B', inline: true },
      {
        name: 'Max. Respawn',
        value: convertSecondstoHMS(maxRespawnTimeScheduleInSeconds) || '--',
        inline: true,
      },
    );
  return bossInfoEmbed;
};

// * parameters = message, boss data, isFound
// * returns isFound result and sends boss info embed
export const sendBossInfoEmbed = (message, data, isFound) => {
  message.channel.send(createBossInfoEmbed(data));
  isFound = true;
  return isFound;
};

// * parameters = boss info
// * returns embed with boss info and its respawn times
export const createBossAddedEmbed = (
  { bossName, location, imageUrl },
  minRespawnDisplay,
  maxRespawnDisplay,
  deathTimeMsg,
) => {
  const bossAddedEmbed = new Discord.MessageEmbed()
    .setColor('#0xf44336')
    .setTitle(bossName)
    .setThumbnail(imageUrl)
    .addFields(
      { name: 'Ubicación', value: location || '--' },
      { name: 'Min. Respawn (España)', value: minRespawnDisplay || '--', inline: false },
      //{ name: '\u200B', value: '\u200B', inline: true },
      { name: 'Max. Respawn (España)', value: maxRespawnDisplay || '--', inline: false },
    )
    .setFooter(
      `Hora de la Muerte: ${deathTimeMsg}`,
      'https://file5s.ratemyserver.net/mobs/1179.gif',
    );
  return bossAddedEmbed;
};

// * parameters = message, boss data, min respawn time, max respawn time, isFound, customTime
// * returns isFound result and sends boss info embed
export const sendBossAddedEmbed = (
  message,
  data,
  minRespawnTimeIn24H,
  maxRespawnTimeIn24H,
  isFound,
  customTime = null,
  timeToShow = null,
) => {
  message.channel.send(
    createBossAddedEmbed(
      data,
      minRespawnTimeIn24H,
      maxRespawnTimeIn24H,
      customTime || getCurrentTimeInHMFormat(),
    ),
  );

  // Mensaje basado en si ya pasó el tiempo de respawn o no
  if (timeToShow <= 0) {
    message.channel.send(
      `¡MVP agregado al tracker con éxito (hora: ${customTime})!\n¡El tiempo de respawn ya ha pasado! El MVP debería estar disponible **ahora**!\nNo se enviarán recordatorios para este MVP.`,
    );
  } else {
    let successMsg;
    
    if (customTime) {
      // Si se usó una hora personalizada, mostrar el tiempo de respawn del MVP (no el tiempo restante)
      const respawnTimeStr = convertSecondstoHMS(data.minRespawnTimeScheduleInSeconds);
      successMsg = `¡MVP agregado al tracker con hora personalizada (${customTime})!\n¡Avisaré dentro de **${respawnTimeStr}**!\nTambién avisaré cuando falten **5 minutos** para que reaparezca.`;
    } else {
      // Si es hora actual, mostrar el tiempo de respawn del MVP
      const respawnTimeStr = convertSecondstoHMS(data.minRespawnTimeScheduleInSeconds);
      successMsg = `¡MVP agregado al tracker con éxito!\n¡Avisaré dentro de **${respawnTimeStr}**!\nTambién avisaré cuando falten **5 minutos** para que reaparezca.`;
    }
    
    message.channel.send(successMsg);
  }


  isFound = true;

  return isFound;
};

// * returns current time in HH:mm format
export const getCurrentTimeInHMFormat = () => {
  let currentTime = moment();
  return moment(currentTime).format('HH:mm');
};

// * returns current time in HH:MM A format
export const getCurrentTimeInHMAFormat = () => {
  let currentTime = moment();
  return moment(currentTime).format('HH:MM');
};

// * returns current time in default format
export const getCurrentTime = () => {
  let currentTime = moment();
  return moment(currentTime);
};

// * returns time in unix format
export const convertToTimestamp = (time) => moment(time).unix();

// * parameters = time in unix
// * returns time in calendar format
export const convertUnixTimeToCalendarFormat = (time) => moment.unix(time).calendar();

// * parameters = time in unix
// * returns time in HM format
export const convertUnixTimeToHMFormat = (time) => moment.unix(time).format('HH:mm');

// * parameters = time in unix
// * returns time in HM A format
export const convertUnixTimeToHMAFormat = (time) => moment.unix(time).format('HH:MM A');

// * parameters = time in seconds
// * returns = added time in calendar format
export const addTimeInSecondsToCalendarFormat = (time) => moment().add(time, 'seconds').calendar();

// * parameters = time in seconds, baseTimestamp (opcional)
// * returns = added time in unix format
export const addTimeInSecondsToUnixFormat = (time, baseTimestamp = null) => {
  if (baseTimestamp) {
    // Si se proporciona un timestamp base, lo usamos como punto de partida
    return moment.unix(baseTimestamp).add(time, 'seconds').unix();
  } else {
    // Comportamiento original (usa el tiempo actual)
    return moment().add(time, 'seconds').unix();
  }
};

// * parameters = time in seconds
// * returns time in milliseconds
export const convertSecondsToMS = (seconds) => seconds * 1000;

// * parameters = file to be written, and data to be written
export const writeFile = (filename, data) => {
  let jsonString = JSON.stringify(data);
  fs.writeFile(filename, jsonString, (err) => {
    if (err) {
      console.log('Error al escribir el fichero!', err);
    } else {
      console.log(`Se ha escrito correctamente sobre el fichero ${filename}`);
    }
  });
};

// * parameters = boss data, message
// * sends the boss list with scheduled respawn times
export const createBossList = ({ bossName }, min, max, message) => {
  message.channel.send(`${bossName} | **Min** ${min} | **Max** ${max} \n`);
};

// * parameter = array
// * sends a sorted array
export const sortArray = (arr) =>
  arr.sort((a, b) => (a.minRespawnTime > b.minRespawnTime ? 1 : -1));
