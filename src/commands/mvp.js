import {
  checkAlias,
  checkInput,
  getCurrentTime,
  convertToTimestamp,
  convertUnixTimeToHMFormat,
  convertUnixTimeToHMAFormat,
  sendBossAddedEmbed,
  sortArray,
} from '../util/common.js';
import moment from 'moment-timezone';

export const name = 'mvp';
export const description = 'Ragnarok Online MVP Tracker Helper Bot';

export const execute = (message, args, bossList) => {
  let input = '';
  let isFound = false;
  let isValidInput = false;
  let isValidAlias = true;
  let currentMVPList = [];
  let currentTimeInUnix = convertToTimestamp(getCurrentTime());
  let minRespawnTime;
  let maxRespawnTime;

  if (args[0] === 'add') {
    // Comprobamos si el último argumento tiene formato de hora (HH:MM)
    let customTime = null;
    let timeArgIndex = -1;

    // Buscamos el argumento de hora entre los argumentos
    for (let i = 1; i < args.length; i++) {
      if (isValidTimeFormat(args[i])) {
        customTime = args[i];
        timeArgIndex = i;
        break;
      }
    }

    // Construimos el input excluyendo el argumento de hora si existe
    for (let i = 1; i < args.length; i++) {
      // Saltamos el argumento de la hora
      if (i !== timeArgIndex) {
        input += args[i] + ' ';
      }
    }

    isValidAlias = checkAlias(input);
    isValidInput = checkInput(input, isValidAlias);

    if (isValidInput) {
      for (let i = 0; i < bossList.bosses.length; i++) {
        if (
          bossList.bosses[i].bossName.toLowerCase().includes(input.toLowerCase().trim()) &&
          !isValidAlias
        ) {
          // Si se proporcionó un tiempo personalizado, lo usamos
          let deathTimeInUnix = currentTimeInUnix;
          
          if (customTime) {
            deathTimeInUnix = getCustomTimeInUnix(customTime);
          }
          
          isFound = setupBossAddedEmbed(
            bossList.bosses[i],
            bossList.bosses[i].minRespawnTimeScheduleInSeconds,
            bossList.bosses[i].maxRespawnTimeScheduleInSeconds,
            isFound,
            message,
            customTime
          );

          // Calcular los tiempos de respawn directamente a partir del tiempo de muerte
          minRespawnTime = deathTimeInUnix + bossList.bosses[i].minRespawnTimeScheduleInSeconds;
          maxRespawnTime = deathTimeInUnix + bossList.bosses[i].maxRespawnTimeScheduleInSeconds;

          bossList.bosses[i].deathTime = deathTimeInUnix;
          bossList.bosses[i].minRespawnTime = minRespawnTime;
          bossList.bosses[i].maxRespawnTime = maxRespawnTime;
          bossList.bosses[i].fiveMinWarningSent = false; // Reiniciamos el flag de aviso
          break;

        } else if (isValidAlias) {
          for (let j = 0; j < bossList.bosses[i].alias.length; j++) {
            if (bossList.bosses[i].alias[j].toLowerCase() === input.toLowerCase().trim()) {
              // Si se proporcionó un tiempo personalizado, lo usamos
              let deathTimeInUnix = currentTimeInUnix;
              
              if (customTime) {
                deathTimeInUnix = getCustomTimeInUnix(customTime);
              }
              
              isFound = setupBossAddedEmbed(
                bossList.bosses[i],
                bossList.bosses[i].minRespawnTimeScheduleInSeconds,
                bossList.bosses[i].maxRespawnTimeScheduleInSeconds,
                isFound,
                message,
                customTime
              );

              // Calcular los tiempos de respawn directamente a partir del tiempo de muerte
              minRespawnTime = deathTimeInUnix + bossList.bosses[i].minRespawnTimeScheduleInSeconds;
              maxRespawnTime = deathTimeInUnix + bossList.bosses[i].maxRespawnTimeScheduleInSeconds;

              bossList.bosses[i].deathTime = deathTimeInUnix;
              bossList.bosses[i].minRespawnTime = minRespawnTime;
              bossList.bosses[i].maxRespawnTime = maxRespawnTime;
              bossList.bosses[i].fiveMinWarningSent = false; // Reiniciamos el flag de aviso
            }
          }
        }
      }
    } else {
      message.channel.send('Por favor, introduce al menos **3 caracteres** o el **alias del MVP** correcto.');
    }
    if (!isFound && isValidInput) {
      message.channel.send(
        'MVP no encontrado! Por favor, vuelve a intentarlo con el **nombre** correcto o el **alias del MVP**.',
      );
    }
  } else if (args[0] === 'list') {
    let txt = '';
    let minTime;
    let maxTime;

    for (let i = 0; i < bossList.bosses.length; i++) {
      if (bossList.bosses[i].deathTime && bossList.bosses[i].minRespawnTime > currentTimeInUnix) {
        currentMVPList.push(bossList.bosses[i]);
      }
    }
    currentMVPList = sortArray(currentMVPList);

    if (currentMVPList.length > 0) {
      for (let i = 0; i < currentMVPList.length; i++) {
        minTime = convertUnixTimeToHMAFormat(currentMVPList[i].minRespawnTime);
        maxTime = convertUnixTimeToHMAFormat(currentMVPList[i].maxRespawnTime);
        txt += `🔹 **${currentMVPList[i].bossName}** | ${minTime} - ${maxTime}\n`;
      }
      message.channel.send(txt);
    } else {
      message.channel.send(
        '⚠️ Aún **no** hay ningún MVP en la lista! Escribe `$mvp add <bossname> [HH:mm]` para agregar uno a la lista.',
      );
    }
  } else if (args[0] === 'clear') {
    for (let i = 0; i < bossList.bosses.length; i++) {
      if (bossList.bosses[i].deathTime) {
        bossList.bosses[i].minRespawnTime = null;
        bossList.bosses[i].maxRespawnTime = null;
        bossList.bosses[i].deathTime = null
        bossList.bosses[i].fiveMinWarningSent = false; // Reiniciamos el flag de aviso
      }
    }
    currentMVPList = null;
    message.channel.send('✅ La lista MVP se ha borrado con **éxito**!');
  } else {
    message.channel.send(
      '⚠️ El commando **no existe**! Escribe `$help` para ver una lista completa de los comandos disponibles.',
    );
  }
};

// Función para validar el formato de hora (HH:MM)
function isValidTimeFormat(timeString) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(timeString);
}

// Función para convertir una hora específica (HH:MM) a timestamp Unix
function getCustomTimeInUnix(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const customTime = new Date();
  customTime.setHours(hours, minutes, 0, 0);
  
  // Si la hora proporcionada ya ha pasado hoy, consideramos dos opciones:
  const now = new Date();
  if (customTime < now) {
    // Si la diferencia es grande (más de 4 horas), asumimos que es para mañana
    if ((now - customTime) > 240 * 60 * 1000) {
      customTime.setDate(customTime.getDate() + 1);
    }
    // Si es menos de 4 horas, asumimos que es tiempo reciente y lo dejamos tal cual
  }
  
  return convertToTimestamp(customTime);
}

// * parameter = boss data
// * returns isFound result
const setupBossAddedEmbed = (
  bossList,
  minRespawnTimeScheduleInSeconds,
  maxRespawnTimeScheduleInSeconds,
  isFound,
  message,
  customTime = null
) => {
  
  // Obtener el timestamp Unix para la hora de muerte (actual o personalizada)
  let deathTimeInUnix;
  let displayTime;

  if (customTime) {
    deathTimeInUnix = getCustomTimeInUnix(customTime);
    // Para mostrar, convertimos la hora de Brasil a España
    const brasilTime = moment.tz(`${customTime}`, 'HH:mm', 'America/Sao_Paulo');
    const spainTime = brasilTime.clone().tz('Europe/Madrid');
    displayTime = `${customTime} (Brasil) = ${spainTime.format('HH:mm')} (España)`;
  } else {
    deathTimeInUnix = convertToTimestamp(getCurrentTime());
    displayTime = getCurrentTimeInHMFormat();
  }

  // Calcular los tiempos de respawn a partir del tiempo de muerte
  const minRespawnTimeUnix = deathTimeInUnix + minRespawnTimeScheduleInSeconds;
  const maxRespawnTimeUnix = deathTimeInUnix + maxRespawnTimeScheduleInSeconds;

  // Convertir los timestamps Unix de respawn a formato HH:mm
  const minRespawnTimeIn24H = convertUnixTimeToHMFormat(minRespawnTimeUnix);
  const maxRespawnTimeIn24H = convertUnixTimeToHMFormat(maxRespawnTimeUnix);
 
  // Calcular el tiempo restante hasta el respawn
  const currentTimeInUnix = convertToTimestamp(getCurrentTime());
  const remainingTimeInSeconds = minRespawnTimeUnix - currentTimeInUnix;

  // Asegurarnos de que no mostramos tiempo negativo
  const timeToShow = Math.max(0, remainingTimeInSeconds);

  isFound = sendBossAddedEmbed(
    message,
    bossList,
    minRespawnTimeIn24H,
    maxRespawnTimeIn24H,
    isFound,
    displayTime,
    timeToShow
  );

  return isFound;
};
