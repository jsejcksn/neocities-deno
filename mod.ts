import {DateTime} from 'https://unpkg.com/luxon@2.3.0/src/luxon.js';

function dateFromRFC2822 (dateTimeString: string): Date {
  return DateTime.fromRFC2822(dateTimeString).toJSDate();
}

const BASE_URL = new URL('https://neocities.org');

enum APIRoute {
  Delete = '/api/delete',
  Info = '/api/info',
  Key = '/api/key',
  List = '/api/list',
  Upload = '/api/upload',
}

type APIResponse<T> = T & { result: string; };
type APIResponseWithMessage<T = unknown> = APIResponse<T> & { message: string; };

type APIErrorResponse = APIResponseWithMessage<{error_type: string}>;

export class FetchError extends Error {
  name = 'FetchError';

  constructor (
    readonly detail: { request?: Request; response: Response; },
    message?: string,
  ) {
    const meta = FetchError.stringifyResponseMeta(detail.response);
    message = message ? `${message}\n\n${meta}` : meta;
    super(message);
  }

  static async createFromJsonMessage (
    detail: ConstructorParameters<typeof FetchError>[0],
    substituteMessage = 'Response not OK',
  ): Promise<FetchError> {
    try {
      const {message} =
        await detail.response.clone().json() as Partial<APIErrorResponse>;

      if (
        typeof message === 'string'
        && message.length > 0
      ) substituteMessage = message;
    }
    catch {/* Body failed to parse as a JSON object */}
    return new FetchError(detail, substituteMessage);
  }

  static stringifyResponseMeta (response: Response): string {
    return JSON.stringify({
      url: response.url,
      status: response.status,
      headers: Object.fromEntries([...response.headers].sort()),
    }, null, 2);
  }
}

/**
 * Generate a new API key (token) for your account.
 * 
 * Read more by navigating to https://neocities.org/settings, then select
 * "Manage Site Settings", then select "API Key".
 */
export async function generateToken (
  username: string,
  password: string,
): Promise<string> {
  const headers = new Headers([[
    'authorization',
    `Basic ${btoa(`${username}:${password}`)}`,
  ]]);

  const url = new URL(APIRoute.Key, BASE_URL);
  const request = new Request(url.href, {headers});
  const clone = request.clone();
  const response = await fetch(request);

  if (!response.ok) {
    throw await FetchError.createFromJsonMessage({request: clone, response});
  }

  return (await response.json() as APIResponse<{api_key: string}>).api_key;
}

function createRequest (
  token: string,
  route: APIRoute,
  options?: RequestInit | URLSearchParams,
): Request {
  const init: RequestInit = (
    typeof options === 'undefined'
    || options instanceof URLSearchParams
  ) ? {} : options;

  const headers = init.headers instanceof Headers ? init.headers
    : new Headers(init.headers);

  headers.set('authorization', `Bearer ${token}`);
  const url = new URL(route, BASE_URL);

  if (options instanceof URLSearchParams) {
    url.search = options.toString();
  }

  return new Request(url.href, {...init, headers});
}

async function fetchResponse (request: Request): Promise<Response> {
  const clone = request.clone();
  const response = await fetch(request);

  if (!response.ok) {
    throw await FetchError.createFromJsonMessage({request: clone, response});
  }

  return response;
}

export type DeleteFilesResponse = APIResponseWithMessage;

/** Delete one or more paths (files/directories) */
export async function deleteFiles (
  token: string,
  fileNames: string[],
): Promise<DeleteFilesResponse> {
  const searchParams = new URLSearchParams();

  for (const fileName of fileNames) {
    searchParams.append('filenames[]', fileName);
  }

  const request = createRequest(token, APIRoute.Delete, {
    body: searchParams,
    method: 'POST',
  });

  const response = await fetchResponse(request);
  return response.json() as Promise<DeleteFilesResponse>;
}

export type InfoResponseRFC2822Dates = {
  /** RFC 2822 datetime */
  created_at: string;
  /** RFC 2822 datetime */
  last_updated: string | null;
};

export type InfoResponseNativeDates = {
  created_at: Date;
  last_updated: Date | null;
}

export type InfoResponse<DateInfo = InfoResponseNativeDates> = APIResponse<{
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
export async function info (token: string): Promise<InfoResponse>;
/** Get info about the named site */
export async function info (
  token: string,
  siteName: string,
): Promise<InfoResponse>;
export async function info (
  token: string,
  siteName?: string,
): Promise<InfoResponse> {
  const options = typeof siteName === 'string' ?
    new URLSearchParams([['sitename', siteName]])
    : undefined;

  const request = createRequest(token, APIRoute.Info, options);
  const response = await fetchResponse(request);
  const data = await response.json() as InfoResponse<InfoResponseRFC2822Dates>;

  return {
    ...data,
    info: {
      ...data.info,
      created_at: dateFromRFC2822(data.info.created_at),
      last_updated: typeof data.info.last_updated === 'string' ?
        dateFromRFC2822(data.info.last_updated)
        : null,
    },
  };
}

export type FSEntryRFC2822Dates = {
  /** RFC 2822 datetime */
  updated_at: string;
};

export type FSEntryNativeDates = {
  updated_at: Date;
};

export type FileWithDateInfo<T> = T & {
  is_directory: false;
  path: string;
  sha1_hash: string | null;
  /** integer (bytes) */
  size: number;
};

export type DirectoryWithDateInfo<T> = T & {
  is_directory: true;
  path: string;
};

export type FileOrDirRFC2822Dates = (
  | FileWithDateInfo<FSEntryRFC2822Dates>
  | DirectoryWithDateInfo<FSEntryRFC2822Dates>
);

export type FileOrDirNativeDates = (
  | FileWithDateInfo<FSEntryNativeDates>
  | DirectoryWithDateInfo<FSEntryNativeDates>
);

export type ListResponse<FileOrDir = FileOrDirNativeDates> =
  APIResponse<{ files: FileOrDir[]; }>;

/** Get a list of all files for your site */
export async function list (token: string): Promise<ListResponse>;
/** Get a list of files for a path in your site */
export async function list (token: string, path: string): Promise<ListResponse>;
export async function list (
  token: string,
  path?: string,
): Promise<ListResponse> {
  const options = typeof path === 'string' ?
    new URLSearchParams([['path', path]])
    : undefined;

  const request = createRequest(token, APIRoute.List, options);
  const response = await fetchResponse(request);
  const data = await response.json() as ListResponse<FileOrDirRFC2822Dates>;

  const files = data.files.map(file => ({
    ...file,
    updated_at: dateFromRFC2822(file.updated_at),
  }));

  return {...data, files};
}

type FileUploadPath = {
  /** Path to where the file should be uploaded. (e.g. `"images/img1.jpg"`) */
  uploadPath: string;
};

export type RawDataFileDetails = FileUploadPath & {
  /**
   * Raw file data.
   *
   * Probably a Uint8Array in most cases. Can be a UTF-8 string if plaintext.
   */
  data: BlobPart;
};

export type LocalPathFileDetails = FileUploadPath & {
  /**
   * Local path (can be relative to CWD) to the file.
   * 
   * Using this option requires `--allow-read` permission for the file's path.
   */
  localPath: string;
};

export type UploadableFileDetails = LocalPathFileDetails | RawDataFileDetails;
export type UploadFilesResponse = APIResponseWithMessage;

/** Upload one or more files */
export async function uploadFiles (
  token: string,
  files: UploadableFileDetails[],
): Promise<UploadFilesResponse> {
  const form = new FormData();

  for (const file of files) {
    if ('data' in file) {
      form.append(file.uploadPath, new Blob([file.data]));
      continue;
    }

    const data = await Deno.readFile(file.localPath);
    form.append(file.uploadPath, new Blob([data]));
  }

  const request = createRequest(token, APIRoute.Upload, {
    body: form,
    method: 'POST',
  });

  const response = await fetchResponse(request);
  return response.json() as Promise<UploadFilesResponse>;
}

export class NeoCitiesAPI {
  constructor (readonly token: string) {}

  /** Delete one or more paths (files/directories) */
  delete (fileNames: string[]): Promise<DeleteFilesResponse> {
    return deleteFiles(this.token, fileNames);
  }

  /** Get info about your site */
  info (): Promise<InfoResponse>;
  /** Get info about the named site */
  info (siteName: string): Promise<InfoResponse>;
  info (siteName?: string): Promise<InfoResponse> {
    return info(this.token, siteName as string);
  }

  /** Get a list of all files for your site */
  list (): Promise<ListResponse>;
  /** Get a list of files for a path in your site */
  list (path: string): Promise<ListResponse>;
  list (path?: string): Promise<ListResponse> {
    return list(this.token, path as string);
  }

  /** Upload one or more files */
  upload (files: UploadableFileDetails[]): Promise<UploadFilesResponse> {
    return uploadFiles(this.token, files);
  }
}
