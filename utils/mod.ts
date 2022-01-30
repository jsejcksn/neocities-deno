export {confirm, prompt} from './prompt.ts';

export function exitWithMessages (code: number, ...messages: string[]): never {
  for (const msg of messages) console[code === 0 ? 'log' : 'error'](msg);
  Deno.exit(code);
}
