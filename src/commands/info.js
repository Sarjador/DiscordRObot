import { checkAlias, checkInput, sendBossInfoEmbed } from '../util/common.js';

export const name = 'info';
export const description = 'Para comprobar la información sobre un MVP.';

export const execute = (message, args, bossList) => {
  let input = args.join(' ');
  let isFound = false;
  let isValidInput = false;
  let isValidAlias = true;

  isValidAlias = checkAlias(input);
  isValidInput = checkInput(input, isValidAlias);

  if (isValidInput) {
    for (let i = 0; i < bossList.bosses.length; i++) {
      if (
        bossList.bosses[i].bossName.toLowerCase().includes(input.toLowerCase().trim()) &&
        !isValidAlias
      ) {
        isFound = sendBossInfoEmbed(message, bossList.bosses[i], isFound);
      } else if (isValidAlias) {
        for (let j = 0; j < bossList.bosses[i].alias.length; j++) {
          if (bossList.bosses[i].alias[j].toLowerCase() === input.toLowerCase().trim()) {
            isFound = sendBossInfoEmbed(message, bossList.bosses[i], isFound);
          }
        }
      }
    }
  } else {
    message.channel.send('Por favor, introduce al menos **3 caracteres** o el **alias del MVP** correcto.');
  }

  if (!isFound && isValidInput) {
    message.channel.send('MVP no encontrado! Vuelve a intentarlo.');
  }
};
