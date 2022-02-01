# neocities-deno

[Neocities.org API](https://neocities.org/api) client: written in TypeScript for use with Deno

> Generated type documentation is available at [doc.deno.land](https://doc.deno.land/https://deno.land/x/neocities/mod.ts).


## API keys

Using this module requires an API key (also called a token) for your account. It's needed to access your account information via the API, so that you can do useful things in your script.

> You can read more about tokens by navigating to your [account settings](https://neocities.org/settings), then select "Manage Site Settings", then select "API Key".

If you haven't already created a token for your account, you can do so by using the `get_token.ts` script. It will ask for your username and password, and then use the API to create a token for you. Once you have your token, you can use it with this module. Here's what it looks like to use the `get_token.ts` script:

```
$ deno run https://deno.land/x/neocities@v0.1.0/get_token.ts
Provide your neocities username and password to obtain your API key:
⚠️  ️Deno requests network access to "neocities.org". Allow? [y/n (y = yes allow, n = no deny)] y
username jsejcksn
password my_very_secret_actually_strong_password
Your neocities API key (token) is:
3287ea7b1960458d8fa1a33f73bf3eb5
```


## How to use


### Setup and running in the console

You can try the following examples. First, create a TypeScript module somewhere on your device: let's say you create an example module at `/neocities-example/example.ts`. This is how you can run your example with the [permissions](https://deno.land/manual@v1.18.1/getting_started/permissions) that it needs:

```
# cd to the directory where you created the TypeScript module
$ cd /neocities-example

# Set any environment variables that you want to use
$ export NEOCITIES_USERNAME=your_actual_username
$ export NEOCITIES_PASSWORD=your_very_secret_actually_strong_password

# Including your API key (token) if you already have it:
$ export NEOCITIES_TOKEN=your_actual_neocities_token

# Run the example module script with the permissions it needs
$ deno run --allow-env=NEOCITIES_USERNAME,NEOCITIES_PASSWORD,NEOCITIES_TOKEN --allow-net=neocities.org --allow-read example.ts
```


### Create an API client

```ts
import {assert} from 'https://deno.land/std@0.123.0/testing/asserts.ts';
import {NeocitiesAPI} from 'https://deno.land/x/neocities@v0.1.0/mod.ts';

// Create an API client from a token

const token = Deno.env.get('NEOCITIES_TOKEN'); // "3287ea7b1960458d8fa1a33f73bf3eb5"
assert(token, 'Token not found');

const api = new NeocitiesAPI(token);
```

```ts
// If you haven't created/saved a token yet, that's ok: you can use your username + password
// This example gets them from environment variables: don't store them in your source code 😅

const username = Deno.env.get('NEOCITIES_USERNAME'); // "jsejcksn"
assert(username, 'Username not found');

const password = Deno.env.get('NEOCITIES_PASSWORD'); // "my_very_secret_actually_strong_password"
assert(password, 'Password not found');

const api = await NeocitiesAPI.createFromCredentials(username, password);
```


### Get site info

```ts
// Get info about your site

const infoResult = await api.info();
console.log(infoResult);
```

> ```
> {
>   result: "success",
>   info: {
>     sitename: "jsejcksn",
>     views: 9,
>     hits: 22,
>     created_at: 2022-01-28T13:11:09.000Z,
>     last_updated: 2022-01-31T00:04:03.000Z,
>     domain: null,
>     tags: [],
>     latest_ipfs_hash: null
>   }
> }
> ```

```ts
// Get info about the named site

const infoResult = await api.info('kyledrake');
console.log(infoResult);
```

> ```
> {
>   result: "success",
>   info: {
>     sitename: "kyledrake",
>     views: 874044,
>     hits: 1072518,
>     created_at: 2013-06-03T06:45:02.000Z,
>     last_updated: 2022-01-06T20:22:34.000Z,
>     domain: "kyledrake.com",
>     tags: [ "personal" ],
>     latest_ipfs_hash: "bafybeicmk3wkw5vqtdzaasybcfuhed3wqtqcfy7u5mfcwy7w2rk5lels4i"
>   }
> }
> ```


### List files

```ts
// Get a list of all files for your site

const listResult = await api.list();
console.log(listResult);
```

> ```
> {
>   result: "success",
>   files: [
>     {
>       path: "index.html",
>       is_directory: false,
>       size: 1083,
>       updated_at: 2022-01-28T13:11:09.000Z,
>       sha1_hash: "99bc354d84057d6900a71d0cb5e8dde069d8689e"
>     },
>     {
>       path: "neocities.png",
>       is_directory: false,
>       size: 13232,
>       updated_at: 2022-01-28T13:11:09.000Z,
>       sha1_hash: "fd2ee41b1922a39a716cacb88c323d613b0955e4"
>     },
>     {
>       path: "not_found.html",
>       is_directory: false,
>       size: 347,
>       updated_at: 2022-01-28T13:11:09.000Z,
>       sha1_hash: "d7f004e9d3b2eaaa8827f741356f1122dc9eb030"
>     },
>     {
>       path: "style.css",
>       is_directory: false,
>       size: 298,
>       updated_at: 2022-01-28T13:11:09.000Z,
>       sha1_hash: "e516457acdb0d00710ab62cc257109ef67209ce8"
>     },
>     { path: "test", is_directory: true, updated_at: 2022-01-31T22:14:11.000Z },
>     {
>       path: "test/text_file1.txt",
>       is_directory: false,
>       size: 9,
>       updated_at: 2022-01-31T22:14:56.000Z,
>       sha1_hash: "02d92c580d4ede6c80a878bdd9f3142d8f757be8"
>     }
>   ]
> }
> ```

```ts
// Get a list of files in the provided directory path in your site

const listResult = await api.list('test');
console.log(listResult);
```

> ```
> {
>   result: "success",
>   files: [
>     {
>       path: "test/text_file1.txt",
>       is_directory: false,
>       size: 9,
>       updated_at: 2022-01-31T22:14:56.000Z,
>       sha1_hash: null
>     }
>   ]
> }
> ```


### Upload files

> You can read more about [which file types can be uploaded](https://neocities.org/site_files/allowed_types).

Let's say you create a text file next to your example script, and you name it `hello-world.txt` with this as the contents:

```
hello world

```

You can upload it by referencing its local path on your device, and the path to where you want to upload it on your site. (You can do this for multiple files at once.)

```ts
// Upload one or more files by local path

import {type UploadableFile} from '../mod.ts';

const files: UploadableFile[] = [
  {
    localPath: './hello-world.txt',
    uploadPath: 'test/hello.txt',
  },
];

const uploadResult = await api.upload(files);
console.log(uploadResult);
```

> ```
> { result: "success", message: "your file(s) have been successfully uploaded" }
> ```

You can also upload raw file data if you want to upload something that doesn't exist as a file on your device. Here's an example of uploading a text file that's created in the script:

```ts
// Upload one or more files as raw data

import {type UploadableFile} from '../mod.ts';

const hello2FileData = `hello other planets, too!`;

const files: UploadableFile[] = [
  {
    data: hello2FileData,
    uploadPath: 'test/hello2.txt',
  },
];

const uploadResult = await api.upload(files);
console.log(uploadResult);
```

> ```
> { result: "success", message: "your file(s) have been successfully uploaded" }
> ```

> You can even include a mix of both types of files in the files array:
> - files on your device, using local paths
> - files created from raw data

Even though the response indicated that the uploads succeeded, you can check to actually see it, by using the `list` method from above with the `"test"` directory path that they were uploaded to:

```ts
const listResult = await api.list('test');
console.log(listResult);
```

> Success confirmed:

> ```
> {
>   result: "success",
>   files: [
>     {
>       path: "test/hello.txt",
>       is_directory: false,
>       size: 12,
>       updated_at: 2022-01-31T22:44:53.000Z,
>       sha1_hash: null
>     },
>     {
>       path: "test/hello2.txt",
>       is_directory: false,
>       size: 25,
>       updated_at: 2022-01-31T22:51:05.000Z,
>       sha1_hash: null
>     },
>     {
>       path: "test/text_file1.txt",
>       is_directory: false,
>       size: 9,
>       updated_at: 2022-01-31T22:14:56.000Z,
>       sha1_hash: null
>     }
>   ]
> }
> ```


### Delete files

> **Be careful with this API method.** There is no way to undo a delete!

You can delete the two files that were uploaded in the last step:

```ts
// Delete one or more paths (files/directories)

const filePathsToDelete = [
  'test/hello.txt',
  'test/hello2.txt',
];

const deleteResult = await api.delete(filePathsToDelete);
console.log(deleteResult);
```

> ```
> { result: "success", message: "file(s) have been deleted" }
> ```

Confirming that they are no longer in the `"test"` folder using the `list` method:

```ts
console.log(await api.list('test'));
```

> ```
> {
>   result: "success",
>   files: [
>     {
>       path: "test/text_file1.txt",
>       is_directory: false,
>       size: 9,
>       updated_at: 2022-01-31T22:14:56.000Z,
>       sha1_hash: null
>     }
>   ]
> }
> ```

> You can also delete an entire directory at once, instead of specifying lots of files to delete. Again, be careful!


## Functional programming

All of the examples above used an instance of the `NeocitiesAPI` stateful class, created from an API token which was used implicitly in each method call.

If you prefer a functional approach, you can use the functional form of each of the class methods, which are also exported:

> If you review the source code, you'll see that the class actually just uses these functions:

```ts
import {
  deleteFiles,
  getSiteInfo,
  getToken,
  listFiles,
  uploadFiles,
  type UploadableFile,
} from 'https://deno.land/x/neocities@v0.1.0/mod.ts';

// declare const username: string;
// declare const password: string;

// get a token using credentials
const token = await getToken(username, password);

// All of the functional forms accept a token as the first argument,
// otherwise, they are identical to the class methods:

// info
let infoResult = await getSiteInfo(token);
infoResult = await getSiteInfo(token, 'kyledrake');

// list
let listResult = await listFiles(token);
listResult = await listFiles(token, 'test');

// upload
const rawFileData = 'hello everyone';
const uploadPath = 'test/hello-everyone.txt';
const files: UploadableFile[] = [{data: rawFileData, uploadPath}];
const uploadResult = await uploadFiles(files);

// delete
const filePathsToDelete = files.map(({uploadPath}) => uploadPath);
const deleteResult = await deleteFiles(filePathsToDelete);
```
