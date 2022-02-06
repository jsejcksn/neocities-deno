import {assert} from '../deps.ts';
import {
  getDateFromRFC2822,
  hasNonNullPropertyValue,
  type OrPromise,
} from './utils/mod.ts';
import {
  API_ORIGIN,
  APIRoute,
  createRequest,
  getFileData,
  fetchResponse,
  type APIResponse,
  type APIResponseWithMessage,
} from './core.ts';

export {
  type APIResponse,
  type APIResponseWithMessage,
  type OrPromise,
};

/**
 * Get the API key (token) for your account
 * 
 * Read more by navigating to https://neocities.org/settings, then select
 * "Manage Site Settings", then select "API Key".
 */
export async function getToken (
  username: string,
  password: string,
): Promise<string> {
  const basicAuth = `Basic ${btoa(`${username}:${password}`)}`;
  const headers = new Headers([['authorization', basicAuth]]);
  const url = new URL(APIRoute.Key, API_ORIGIN);
  const request = new Request(url.href, {headers});
  const response = await fetchResponse(request);

  const token =
    (await response.json() as APIResponse<{ api_key: string; }>).api_key;

  assert(token, 'Token not found');
  return token;
}

export type DeleteFilesResponse = APIResponseWithMessage;

/** Delete one or more paths (files/directories) */
export async function deleteFiles (
  token: string,
  paths: string[],
): Promise<DeleteFilesResponse> {
  const searchParams = new URLSearchParams();

  for (const path of paths) {
    searchParams.append('filenames[]', path);
  }

  const request = createRequest(token, APIRoute.Delete, {
    body: searchParams,
    method: 'POST',
  });

  const response = await fetchResponse(request);
  return response.json() as Promise<DeleteFilesResponse>;
}

type InfoResponseDatesRFC2822 = {
  /** RFC 2822 datetime */
  created_at: string;

  /** RFC 2822 datetime */
  last_updated: string | null;
};

export type InfoResponseDatesNative = {
  created_at: Date;
  last_updated: Date | null;
};

export type InfoResponse<DateInfo extends (
  | InfoResponseDatesRFC2822
  | InfoResponseDatesNative
) = InfoResponseDatesNative> = APIResponse<{
  info: DateInfo & {
    domain: string | null;

    /** integer */
    hits: number;

    latest_ipfs_hash: string | null;
    sitename: string;
    tags: string[];

    /** integer */
    views: number;
  }
}>;

/** Get info about your site */
export async function getSiteInfo (token: string): Promise<InfoResponse>;

/** Get info about the named site */
export async function getSiteInfo (
  token: string,
  siteName: string,
): Promise<InfoResponse>;

export async function getSiteInfo (
  token: string,
  siteName?: string,
): Promise<InfoResponse> {
  const options = typeof siteName === 'string' ?
    new URLSearchParams([['sitename', siteName]])
    : undefined;

  const request = createRequest(token, APIRoute.Info, options);
  const response = await fetchResponse(request);
  const data = await response.json() as InfoResponse<InfoResponseDatesRFC2822>;

  return {
    ...data,
    info: {
      ...data.info,
      created_at: getDateFromRFC2822(data.info.created_at),
      last_updated: typeof data.info.last_updated === 'string' ?
        getDateFromRFC2822(data.info.last_updated)
        : null,
    },
  };
}

type FSEntryDatesRFC2822 = {
  /** RFC 2822 datetime */
  updated_at: string;
};

export type FSEntryDatesNative = {
  updated_at: Date;
};

export type FileWithDateInfo<DateInfo extends (
  | FSEntryDatesRFC2822
  | FSEntryDatesNative
) = FSEntryDatesNative> = DateInfo & {
  is_directory: false;
  path: string;
  sha1_hash: string | null;

  /** integer (bytes) */
  size: number;
};

export type DirectoryWithDateInfo<DateInfo extends (
  | FSEntryDatesRFC2822
  | FSEntryDatesNative
) = FSEntryDatesNative> = DateInfo & {
  is_directory: true;
  path: string;
};

export type FileOrDir<DateInfo extends (
  | FSEntryDatesRFC2822
  | FSEntryDatesNative
) = FSEntryDatesNative> = (
  | FileWithDateInfo<DateInfo>
  | DirectoryWithDateInfo<DateInfo>
);

export type ListResponse<
  DateInfo extends (
    | FSEntryDatesRFC2822
    | FSEntryDatesNative
  ) = FSEntryDatesNative,
  FSEntry = FileOrDir<DateInfo>,
> = APIResponse<{ files: FSEntry[]; }>;

/** Get a list of all files for your site */
export async function listFiles (token: string): Promise<ListResponse>;

/** Get a list of files in the provided directory path in your site */
export async function listFiles (
  token: string,
  directoryPath: string,
): Promise<ListResponse>;

export async function listFiles (
  token: string,
  directoryPath?: string,
): Promise<ListResponse> {
  const options = typeof directoryPath === 'string' ?
    new URLSearchParams([['path', directoryPath]])
    : undefined;

  const request = createRequest(token, APIRoute.List, options);
  const response = await fetchResponse(request);
  const data = await response.json() as ListResponse<FSEntryDatesRFC2822>;

  const files = data.files.map(file => ({
    ...file,
    updated_at: getDateFromRFC2822(file.updated_at),
  }));

  return {...data, files};
}

export type FileUploadPath = {
  /** Path to where the file should be uploaded (e.g. `"images/img1.jpg"`) */
  uploadPath: string;
};

export type UploadableFileRawData = FileUploadPath & {
  /** Raw file data */
  data: OrPromise<BlobPart>;
};

export type UploadableFileSource = FileUploadPath & {
  /**
   * Path or URL of the source file to be uploaded
   *
   * (Deno-only)
   * Requires permission `--allow-read` for local files,
   * and `--allow-net` for remote files.
   */
  source: string | URL;
};

export type UploadableFile = UploadableFileSource | UploadableFileRawData;
export type UploadFilesResponse = APIResponseWithMessage;

/** Upload one or more files */
export async function uploadFiles (
  token: string,
  files: UploadableFile[],
): Promise<UploadFilesResponse> {
  const form = new FormData();

  for (const file of files) {
    const blobPart = await (
      hasNonNullPropertyValue<UploadableFileRawData>(file, 'data') ?
        file.data
        : getFileData(file.source)
    );

    form.append(file.uploadPath, new Blob([blobPart]));
  }

  const request = createRequest(token, APIRoute.Upload, {
    body: form,
    method: 'POST',
  });

  const response = await fetchResponse(request);
  return response.json() as Promise<UploadFilesResponse>;
}

export class NeocitiesAPI {
  #token: string;

  constructor (token: string) {
    this.#token = token;
  }

  static async createFromCredentials (
    username: string,
    password: string,
  ): Promise<NeocitiesAPI> {
    const token = await getToken(username, password);
    return new this(token);
  }

  /** Delete one or more paths (files/directories) */
  delete (paths: string[]): Promise<DeleteFilesResponse> {
    return deleteFiles(this.#token, paths);
  }

  /** Get info about your site */
  info (): Promise<InfoResponse>;

  /** Get info about the named site */
  info (siteName: string): Promise<InfoResponse>;

  info (siteName?: string): Promise<InfoResponse> {
    return getSiteInfo(this.#token, siteName as string);
  }

  /** Get a list of all files for your site */
  list (): Promise<ListResponse>;

  /** Get a list of files in the provided directory path in your site */
  list (directoryPath: string): Promise<ListResponse>;

  list (directoryPath?: string): Promise<ListResponse> {
    return listFiles(this.#token, directoryPath as string);
  }

  /** Upload one or more files */
  upload (files: UploadableFile[]): Promise<UploadFilesResponse> {
    return uploadFiles(this.#token, files);
  }
}
