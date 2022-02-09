import {assert, path} from '../deps.ts';
import {
  createRequest,
  fetchResponse,
  getFileData,
} from './core.ts';

const projectDir = path.join(path.dirname(path.fromFileUrl(import.meta.url)), '..');
const testDataDir = path.join(projectDir, 'src', 'testdata');

const decoder = new TextDecoder();
const encoder = new TextEncoder();

Deno.test({
  name: 'getFileData',
  fn: async (ctx) => {
    async function assertIsTestFile (fileSource: Parameters<typeof getFileData>[0]): Promise<void> {
      const buf = await getFileData(fileSource);
      const [actual] = decoder.decode(buf).split(/\r?\n/);
      const expected = JSON.stringify({message: 'hello world'});
      assert(actual === expected);
    }

    await ctx.step('reads local file by relative path', async () => {
      const filePath = path.join('src', 'testdata', 'hello.json');
      assert(!path.isAbsolute(filePath));
      await assertIsTestFile(filePath);
    });

    await ctx.step('reads local file by absolute path', async () => {
      const filePath = path.join(testDataDir, 'hello.json');
      assert(path.isAbsolute(filePath));
      await assertIsTestFile(filePath);
    });

    await ctx.step('reads local file by file URL', async () => {
      const fileUrl = path.toFileUrl(path.join(testDataDir, 'hello.json'));
      assert(fileUrl instanceof URL);
      await assertIsTestFile(fileUrl);
    });

    await ctx.step('reads local file by file URL string', async () => {
      const fileUrl = path.toFileUrl(path.join(testDataDir, 'hello.json')).href;
      assert(fileUrl.startsWith('file://'));
      await assertIsTestFile(fileUrl);
    });
  },
});
