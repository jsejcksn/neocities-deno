import {path} from '../../deps.ts';

export {confirm, prompt} from './prompt.ts';
export {getDateFromRFC2822} from './datetime.ts';

/** https://github.com/denoland/manual/pull/213#issuecomment-1026456953 */
// deno-lint-ignore no-explicit-any
export const isDeno = typeof (globalThis as any).Deno === 'object';

/** Terminate the Deno program after printing one or more messages */
export function exitWithMessages (code: number, ...messages: string[]): never {
  for (const msg of messages) console[code === 0 ? 'log' : 'error'](msg);
  Deno.exit(code);
}

export type AsURLOptions = {
  /**
   * This option appplies only to Deno.
   *
   * Set to `true` if you have set `window.location` for your program, and want
   * a `file:` URL.
   *
   * ---
   *
   * By default, inputs are resolved using `window.location.href`
   * as a base. In the case that the window location is `undefined`, a URL using
   * the `file:` protocol will be created.
   *
   * In a Deno program, the window location will be `undefined` by default
   * (unless a value for the `--location` CLI argument was provided when
   * starting the program).
   *
   * Read more at https://deno.land/manual@v1.18.2/runtime/location_api
   * or use `deno help run`.
   *
   * Default: `false`
   */
  fileURL?: boolean;
};

export function asURL (input: string | URL, options?: AsURLOptions): URL {
  if (input instanceof URL) return input;

  const hasValidProtocolPrefix = (/^(?:https?|file):\/\//).test(input);
  if (hasValidProtocolPrefix) return new URL(input);

  const baseUrl: string | undefined = window.location?.href;
  const useFileProtocol = isDeno && !baseUrl || options?.fileURL;

  if (useFileProtocol) {
    const absolutePath = path.isAbsolute(input) ? input : path.resolve(input);
    return path.toFileUrl(absolutePath);
  }

  return new URL(input, baseUrl);
}

export function hasNonNullPropertyValue <T>(
  value: Record<PropertyKey, unknown>,
  key: keyof T,
): value is Record<typeof key, NonNullable<T[typeof key]>> {
  return key in value && typeof value[key] != null;
}
