import {DateTime} from '../deps.ts';
export {confirm, prompt} from './prompt.ts';

/** Terminate the program after printing one or more messages */
export function exitWithMessages (code: number, ...messages: string[]): never {
  for (const msg of messages) console[code === 0 ? 'log' : 'error'](msg);
  Deno.exit(code);
}

/** Parses an RFC 2822-formatted datetime string and returns a `Date` */
export function getDateFromRFC2822 (dateTimeString: string): Date {
  return DateTime.fromRFC2822(dateTimeString).toJSDate();
}
