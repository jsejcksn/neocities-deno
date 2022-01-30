import {exitWithMessages, prompt} from './utils/mod.ts';
import {getToken} from './mod.ts';

async function main () {
  const authParts: Parameters<typeof getToken> = ['', ''];

  for (const [index, part] of ['username', 'password'].entries()) {
    const value = await prompt(`neocities ${part}`);
    if (!value) exitWithMessages(1, `Your ${part} is required to obtain your API key.`);
    authParts[index] = value;
  }

  const status = await Deno.permissions.request({name: 'net', host: 'neocities.org'});
  if (status.state !== 'granted') {
    exitWithMessages(1, `Network access to "neocities.org" is required to obtain your API key.`);
  }

  const token = await getToken(...authParts);
  exitWithMessages(0, `Your neocities API key (token) is:`, token);
}

if (import.meta.main) main();
