import {DateTime} from '../../deps.ts';

/** Parses an RFC 2822-formatted datetime string and returns a `Date` */
export function getDateFromRFC2822 (dateTimeString: string): Date {
  return DateTime.fromRFC2822(dateTimeString).toJSDate();
}
