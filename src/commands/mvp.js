import {
  addTimeInSecondsToCalendarFormat,
  addTimeInSecondsToUnixFormat,
  checkAlias,
  checkInput,
  getCurrentTime,
  convertToTimestamp,
  convertUnixTimeToHMFormat,
  convertUnixTimeToHMAFormat,
  sendBossAddedEmbed,
  sortArray,
} from '../util/common.js';
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
    for (let i = 1; i < args.length; i++) {
      input += args[i] + ' ';
    }

    isValidAlias = checkAlias(input);
    isValidInput = checkInput(input, isValidAlias);

    if (isValidInput) {
      for (let i = 0; i < bossList.bosses.length; i++) {
        if (
          bossList.bosses[i].bossName.toLowerCase().includes(input.toLowerCase().trim()) &&
          !isValidAlias
        ) {
          isFound = setupBossAddedEmbed(
            bossList.bosses[i],
            bossList.bosses[i].minRespawnTimeScheduleInSeconds,
            bossList.bosses[i].maxRespawnTimeScheduleInSeconds,
            isFound,
            message,
          );

          //  change deathTime, minRespawn and maxRespawn in bossList file

          minRespawnTime = addTimeInSecondsToUnixFormat(
            bossList.bosses[i].minRespawnTimeScheduleInSeconds,
          );
          maxRespawnTime = addTimeInSecondsToUnixFormat(
            bossList.bosses[i].maxRespawnTimeScheduleInSeconds,
          );

          bossList.bosses[i].deathTime = currentTimeInUnix;
          bossList.bosses[i].minRespawnTime = minRespawnTime;
          bossList.bosses[i].maxRespawnTime = maxRespawnTime;
          break;
        } else if (isValidAlias) {
          for (let j = 0; j < bossList.bosses[i].alias.length; j++) {
            if (bossList.bosses[i].alias[j].toLowerCase() === input.toLowerCase().trim()) {
              isFound = setupBossAddedEmbed(
                bossList.bosses[i],
                bossList.bosses[i].minRespawnTimeScheduleInSeconds,
                bossList.bosses[i].maxRespawnTimeScheduleInSeconds,
                isFound,
                message,
              );
              //  change deathTime, minRespawn and maxRespawn in bossList file

              minRespawnTime = addTimeInSecondsToUnixFormat(
                bossList.bosses[i].minRespawnTimeScheduleInSeconds,
              );
              maxRespawnTime = addTimeInSecondsToUnixFormat(
                bossList.bosses[i].maxRespawnTimeScheduleInSeconds,
              );

              bossList.bosses[i].deathTime = currentTimeInUnix;
              bossList.bosses[i].minRespawnTime = minRespawnTime;
              bossList.bosses[i].maxRespawnTime = maxRespawnTime;
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
        '⚠️ Aún **no** hay ningún MVP en la lista! Escribe `$mvp add <bossname>` para agregar uno a la lista.',
      );
    }
  } else if (args[0] === 'clear') {
    for (let i = 0; i < bossList.bosses.length; i++) {
      if (bossList.bosses[i].deathTime) {
        bossList.bosses[i].minRespawnTime = null;
        bossList.bosses[i].maxRespawnTime = null;
        bossList.bosses[i].deathTime = null;
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

// * parameter = boss data
// * returns isFound result
const setupBossAddedEmbed = (
  bossList,
  minRespawnTimeScheduleInSeconds,
  maxRespawnTimeScheduleInSeconds,
  isFound,
  message,
) => {
  let minRespawnTimeIn24H;
  let maxRespawnTimeIn24H;
  
  // Agregamos los segundos al formato Unix y luego lo pasamos a formato HH:mm
  minRespawnTimeIn24H = convertUnixTimeToHMFormat(addTimeInSecondsToUnixFormat(minRespawnTimeScheduleInSeconds));
  maxRespawnTimeIn24H = convertUnixTimeToHMFormat(addTimeInSecondsToUnixFormat(maxRespawnTimeScheduleInSeconds));

  isFound = sendBossAddedEmbed(
    message,
    bossList,
    minRespawnTimeIn24H,
    maxRespawnTimeIn24H,
    isFound,
  );

  return isFound;
};
