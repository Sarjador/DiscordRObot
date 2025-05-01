export const name = 'help';
export const description = 'To check the available bot commands';

export const execute = (message, args) => {
  if (args.length === 0) {
    message.channel.send({ embed: helpEmbed });
  } else {
    message.channel.send(
      'Command **does not exist**! Please enter `$help` for the list of bot commands.',
    );
  }
};

const helpEmbed = {
  color: 0xd8bfdd,
  title: 'Spanish Tatami MVP Helper Bot Commands',
  thumbnail: {
    url: '../../img/bot_avatar.jpg',
  },
  fields: [
    {
      name: '$help',
      value: 'To view all the available bot commands',
    },
    {
      name: '$info <bossname>',
      value: 'To view the information of a specific boss',
    },
    {
      name: '$mvp add <bossname>',
      value:
        "To add a boss into the MVP list \nThis will also set a reminder on the boss' scheduled respawn time",
    },
    {
      name: '$mvp list',
      value: 'To view the list of the current MVPs with a respawn time schedule',
    },
    {
      name: '$mvp clear',
      value:
        'To clear all contents in the MVP list. \nUse this **ONLY** when there is a server restart',
    },
  ],
  footer: {
    text: '> Spanish Tatami discord Bot is based on Sprinkles from 🌺 Xaikyu 🌺#3108 and Jeee#0016 and modified by me (Sarjador)',
  },
};
