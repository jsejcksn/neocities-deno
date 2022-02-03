import {API_ORIGIN} from './src/core.ts';
import {exitWithMessages, prompt} from './src/utils.ts';
import {getToken} from './mod.ts';

async function main () {
  console.log(`Provide your neocities username and password to obtain your API key:`);

  const {host, hostname} = new URL(API_ORIGIN);
  const status = await Deno.permissions.request({name: 'net', host});

  if (status.state !== 'granted') {
    exitWithMessages(1, `Network access to "${hostname}" is required to obtain your API key.`);
  }

  const authParts: Parameters<typeof getToken> = ['', ''];

  for (const [index, part] of ['username', 'password'].entries()) {
    const value = await prompt(part);
    if (!value) exitWithMessages(1, `Your ${part} is required to obtain your API key.`);
    authParts[index] = value;
  }

  const token = await getToken(...authParts);
  exitWithMessages(0, `Your neocities API key (token) is:`, token);
}

if (import.meta.main) main();
