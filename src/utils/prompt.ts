const CR = '\r'.codePointAt(0);
const LF = '\n'.codePointAt(0);
const decoder = new TextDecoder();
const encoder = new TextEncoder();

export async function confirm (message = 'Confirm'): Promise<boolean> {
  if (!Deno.isatty(Deno.stdin.rid)) return false;
  await Deno.stdout.write(encoder.encode(`${message} [y/N] `));
  const answer = await readLineFromStdin();
  return answer === 'Y' || answer === 'y';
}

export async function prompt (
  message = 'Prompt',
  defaultValue?: string,
): Promise<string | undefined> {
  if (!Deno.isatty(Deno.stdin.rid)) return undefined;
  await Deno.stdout.write(encoder.encode(`${message} `));
  if (typeof defaultValue === 'string') {
    await Deno.stdout.write(encoder.encode(`[${defaultValue}] `));
  }
  return await readLineFromStdin() || defaultValue;
}

async function readLineFromStdin (): Promise<string> {
  const buf = new Uint8Array(1);
  const codes = [];
  while (true) {
    const n = await Deno.stdin.read(buf);
    if (n === 0 || buf[0] === LF) break;
    codes.push(buf[0]);
  }
  if (codes.at(-1) === CR) codes.splice(-1, 1);
  return decoder.decode(new Uint8Array(codes));
}
