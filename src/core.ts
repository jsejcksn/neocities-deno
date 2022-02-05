import {asURL} from './utils/mod.ts';

export const API_ORIGIN = 'https://neocities.org';

export enum APIRoute {
  Delete = '/api/delete',
  Info = '/api/info',
  Key = '/api/key',
  List = '/api/list',
  Upload = '/api/upload',
}

export type APIResponse<T> = T & { result: string; };

export type APIResponseWithMessage<T = unknown> =
  APIResponse<T> & { message: string; };

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

export function createRequest (
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
  const url = new URL(route, API_ORIGIN);
  if (options instanceof URLSearchParams) url.search = options.toString();
  return new Request(url.href, {...init, headers});
}

export async function fetchResponse (request: Request): Promise<Response> {
  const clone = request.clone();
  const response = await fetch(request);

  if (!response.ok) {
    throw await FetchError.createFromJsonMessage({request: clone, response});
  }

  return response;
}

export async function getFileData (source: string | URL): Promise<ArrayBuffer> {
  const request = new Request(asURL(source).href);
  const response = await fetchResponse(request);
  return response.arrayBuffer();
}
