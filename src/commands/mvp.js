import {
  checkAlias,
  checkInput,
  getCurrentTime,
  getCurrentTimeInHMFormat ,
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

  // Crear la fecha/hora en timezone de São Paulo (Brasil) para HOY
  let serverTime = moment.tz('America/Sao_Paulo').set({
    hour: hours,
    minute: minutes,
    second: 0,
    millisecond: 0
  });

  // Si la hora proporcionada ya ha pasado hoy en Brasil, consideramos dos opciones:
  const nowInServer = moment.tz('America/Sao_Paulo');
  if (serverTime.isBefore(nowInServer)) {
    // Si la diferencia es grande (más de 4 horas), asumimos que es para mañana
    if (nowInServer.diff(serverTime, 'hours') > 4) {
      serverTime.add(1, 'day');
    }
  }
  
  // Convertir a timezone de Madrid (España)
  const spainTime = serverTime.clone().tz('Europe/Madrid');

  console.log(`Hora Servidor: ${serverTime.format('HH:mm DD/MM')} -> Hora España: ${spainTime.format('HH:mm DD/MM')}`);

  return spainTime.unix();
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
  let minRespawnDisplay, maxRespawnDisplay;

  if (customTime) {
    // Calcular todo desde la hora original del Server
    const [hours, minutes] = customTime.split(':').map(Number);
    
    // Crear la fecha/hora original en el Server
    let serverDeathTime = moment.tz('America/Sao_Paulo').set({
      hour: hours,
      minute: minutes,
      second: 0,
      millisecond: 0
    });
    
    // Manejar si la hora ya pasó hoy
    const nowInServer = moment.tz('America/Sao_Paulo');
    if (serverDeathTime.isBefore(nowInServer)) {
      if (nowInServer.diff(serverDeathTime, 'hours') > 4) {
        serverDeathTime.add(1, 'day');
      }
    }
    
    // Convertir a España para los cálculos internos
    const spainDeathTime = serverDeathTime.clone().tz('Europe/Madrid');
    deathTimeInUnix = spainDeathTime.unix();
    
    // Calcular respawn en hora del Server (hora original + tiempo de respawn)
    const serverMinRespawn = serverDeathTime.clone().add(minRespawnTimeScheduleInSeconds, 'seconds');
    const serverMaxRespawn = serverDeathTime.clone().add(maxRespawnTimeScheduleInSeconds, 'seconds');

    // Convertir los respawn a España
    const spainMinRespawn = serverMinRespawn.clone().tz('Europe/Madrid');
    const spainMaxRespawn = serverMaxRespawn.clone().tz('Europe/Madrid');

    // Formatear para mostrar
    minRespawnDisplay = `${serverMinRespawn.format('HH:mm')} (Server) / ${spainMinRespawn.format('HH:mm')} (España)`;
    maxRespawnDisplay = `${serverMaxRespawn.format('HH:mm')} (Server) / ${spainMaxRespawn.format('HH:mm')} (España)`;
    displayTime = `${customTime} (Server) = ${spainDeathTime.format('HH:mm')} (España)`;
    
  } else {
    // Si es hora actual (española), usar el comportamiento original
    deathTimeInUnix = convertToTimestamp(getCurrentTime());
    displayTime = getCurrentTimeInHMFormat();
    
    const minRespawnTimeUnix = deathTimeInUnix + minRespawnTimeScheduleInSeconds;
    const maxRespawnTimeUnix = deathTimeInUnix + maxRespawnTimeScheduleInSeconds;
    
    minRespawnDisplay = convertUnixTimeToHMFormat(minRespawnTimeUnix);
    maxRespawnDisplay = convertUnixTimeToHMFormat(maxRespawnTimeUnix);
  }
 
  // Calcular el tiempo restante hasta el respawn (siempre en hora española)
  const minRespawnTimeUnix = deathTimeInUnix + minRespawnTimeScheduleInSeconds;
  const currentTimeInUnix = convertToTimestamp(getCurrentTime());
  const remainingTimeInSeconds = minRespawnTimeUnix - currentTimeInUnix;
  const timeToShow = Math.max(0, remainingTimeInSeconds);

  isFound = sendBossAddedEmbed(
    message,
    bossList,
    minRespawnDisplay,
    maxRespawnDisplay,
    isFound,
    displayTime,
    timeToShow
  );

  return isFound;
};
