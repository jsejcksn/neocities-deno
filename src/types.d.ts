export type APIResponse<T> = T & { result: string; };

export type APIResponseWithMessage<T = unknown> =
  APIResponse<T> & { message: string; };

export type APIErrorResponse = APIResponseWithMessage<{ error_type: string; }>;
export type DeleteFilesResponse = APIResponseWithMessage;
export type UploadFilesResponse = APIResponseWithMessage;

export type InfoResponseDatesRFC2822 = {
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

export type FSEntryDatesRFC2822 = {
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
