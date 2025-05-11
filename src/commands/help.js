export const name = 'help';
export const description = 'Para ver los comandos disponibles del bot';

export const execute = (message, args) => {
  if (args.length === 0) {
    message.channel.send({ embed: helpEmbed });
  } else {
    message.channel.send(
      'El commando **no existe**! Escribe `$help` para ver una lista completa de los comandos disponibles.',
    );
  }
};

const helpEmbed = {
  color: 0xd8bfdd,
  title: 'Spanish Tatami MVP Tracker Helper Bot Commands',
  thumbnail: {
    url: '../../img/bot_avatar.jpg',
  },
  fields: [
    {
      name: '$help',
      value: 'Para ver todos los comandos disponibles del bot.',
    },
    {
      name: '$info <bossname>',
      value: 'Para ver la información de un MVP en concreto.',
    },
    {
      name: '$mvp add <bossname>',
      value:
        "Para agregar un MVP a la lista. \nEsto también establecerá un recordatorio de la hora de reaparición del MVP.",
    },
    {
      name: '$mvp list',
      value: 'Para ver la lista de los MVP actuales con horario de respawn.',
    },
    {
      name: '$mvp clear',
      value:
        'Para limpiar todos los MVP de la lista. \nRecomendado: Usar **SOLO** cuando haya en reinicio del server',
    },
  ],
  footer: {
    text: '> Spanish Tatami MVP Tracker Discord Bot is based on Sprinkles from 🌺 Xaikyu 🌺#3108 and Jeee#0016, updated and translated by Sarjador.',
  },
};
