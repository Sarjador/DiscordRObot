import 'dotenv/config';
import Discord from 'discord.js';
import { BOSS_DATA_DIRECTORY, BOT_NAME, DEFAULT_COMMAND_PREFIX, events } from './globals/constants.js';
import * as commandManager from './util/commandManager.js';
import {
  convertToTimestamp,
  convertUnixTimeToCalendarFormat,
  convertUnixTimeToHMFormat,
  getCurrentTime,
  getCurrentTimeInHMFormat,
  readFile,
  writeFile,
} from './util/common.js';

const discordClient = new Discord.Client();
let reminderChannels = [];
const bossList = readFile(BOSS_DATA_DIRECTORY);
const onReady = () => {
  commandManager.loadCommands(discordClient).then(onLoad);
};

const onLoad = () => {
  console.log(`${BOT_NAME} is online!`);
  checkMvpRespawnTimers();
};

const checkMvpRespawnTimers = () => {
  setInterval(() => {
    let currentTime = convertToTimestamp(getCurrentTime());
    for (let i = 0; i < bossList.bosses.length; i++) {
      // Verificar que el boss tiene timestamps válidos antes de procesar
      if (!bossList.bosses[i].deathTime || !bossList.bosses[i].minRespawnTime) {
        continue; // Saltar este boss si no tiene tiempo de muerte registrado
      }

      // → AVISO a 5 minutos
      // Ajusta 5*60 si tus timestamps están en segundos, o 5*60*1000 si son milisegundos.
      const fiveMinThreshold = bossList.bosses[i].minRespawnTime - 5 * 60;
      if (!bossList.bosses[i].fiveMinWarningSent &&
          currentTime >= fiveMinThreshold &&
          currentTime < bossList.bosses[i].minRespawnTime
      ) {
        const warningEmbed = new Discord.MessageEmbed()
          .setColor('#FFA500')
          .setTitle(`⚠️Faltan 5 min. para que respawnee **${bossList.bosses[i].bossName}**⚠️`)
          .setThumbnail(bossList.bosses[i].imageUrl)
          .addFields(
            {
              name: 'Min. Respawn',
              value: convertUnixTimeToHMFormat(bossList.bosses[i].minRespawnTime) || '--',
              inline: true,
            },
            {
              name: 'Max. Respawn',
              value: convertUnixTimeToHMFormat(bossList.bosses[i].maxRespawnTime) || '--',
              inline: true,
            },
          )
          .setFooter(
            `Hora Actual: ${getCurrentTimeInHMFormat()}`,
            'https://file5s.ratemyserver.net/mobs/1476.gif'
          );
        reminderChannels.forEach((channel) => {
          channel.send(warningEmbed);
          channel.send('@everyone calienta, que sales! 🏃‍♂️💨');
        });
        bossList.bosses[i].fiveMinWarningSent = true;
      }

      if (bossList.bosses[i].deathTime && currentTime >= bossList.bosses[i].minRespawnTime) {
        const remindEmbed = new Discord.MessageEmbed()
          .setColor('#0x43a047')
          .setTitle(`El MVP ${bossList.bosses[i].bossName} va a respawnear **¡YA!** `)
          .setThumbnail(bossList.bosses[i].imageUrl)
          .addFields(
            {
              name: 'Min. Respawn',
              value: convertUnixTimeToHMFormat(bossList.bosses[i].minRespawnTime) || '--',
              inline: true,
            },
            {
              name: 'Max. Respawn',
              value: convertUnixTimeToHMFormat(bossList.bosses[i].maxRespawnTime) || '--',
              inline: true,
            },
          )
          .setFooter(
            `Hora Actual: ${getCurrentTimeInHMFormat()}`,
            'https://file5s.ratemyserver.net/mobs/1476.gif'
          );
        reminderChannels.forEach((channel) => {
          channel.send(remindEmbed);
          channel.send('@everyone'+' a darle estopa! ;)');
        });
        bossList.bosses[i].deathTime = null;
        bossList.bosses[i].minRespawnTime = null;
        bossList.bosses[i].maxRespawnTime = null;
        bossList.bosses[i].fiveMinWarningSent = false;
      }
    }
  }, 1000);

  setInterval(function () {
    writeFile(BOSS_DATA_DIRECTORY, bossList);
  }, 30000);
};

const onMessageReceived = (message) => {
  if (!message.content.startsWith(DEFAULT_COMMAND_PREFIX) || message.author.bot) return;

  const args = message.content.slice(DEFAULT_COMMAND_PREFIX.length).split(/ +/);
  const command = args.shift().toLowerCase();

  if (command == 'mvp') {
    discordClient.commands.get('mvp').execute(message, args, bossList);
  } else if (command == 'help') {
    discordClient.commands.get('help').execute(message, args);
  } else if (command == 'info') {
    discordClient.commands.get('info').execute(message, args, bossList);
  } else if (command == 'set-reminder-channel') {
    if (reminderChannels.filter((channel) => channel.id === message.channel.id).length > 0) {
      message.channel.send('[ERROR] Los recordatorios MVP ya se estan enviando a este canal.');
    } else {
      reminderChannels.push(message.channel);
      message.channel.send('[SUCCESS] Los recordatorios MVP se enviarán a este canal a partir de ahora.');
    }
  } else {
    message.channel.send(
      '⚠️ El commando **no existe**! Escribe `$help` para ver una lista completa de los comandos disponibles.',
    );
  }
};

discordClient.once(events.READY, onReady);
discordClient.on(events.MESSAGE, onMessageReceived);
discordClient.login(`${process.env.TOKEN}`)
  .then(() => console.log('Conectado a Discord!'))
  .catch(err => console.error('Error al conectar:', err));

