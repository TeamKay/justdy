const DAILY_API_BASE = "https://api.daily.co/v1";

export type DailyRoom = {
  id?: string;
  name: string;
  url: string;
  privacy?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
};

type DailyRequestOptions = RequestInit & {
  body?: BodyInit | null;
};

class DailyApiError extends Error {
  status: number;
  details: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "DailyApiError";
    this.status = status;
    this.details = details;
  }
}

function getDailyApiKey(): string {
  const key = process.env.DAILY_API_KEY;

  if (!key) {
    throw new Error(
      "DAILY_API_KEY is not configured.",
    );
  }

  return key;
}

async function dailyRequest<T>(
  path: string,
  options: DailyRequestOptions = {},
): Promise<T> {
  const response = await fetch(
    `${DAILY_API_BASE}${path}`,
    {
      ...options,

      headers: {
        Authorization: `Bearer ${getDailyApiKey()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers ?? {}),
      },

      cache: "no-store",
    },
  );

  const raw = await response.text();

  let payload: unknown = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    const info =
      typeof payload === "object" &&
      payload !== null &&
      "info" in payload
        ? String(
            (payload as { info?: unknown }).info ?? "",
          )
        : "";

    const error =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload
        ? String(
            (payload as { error?: unknown }).error ?? "",
          )
        : "";

    throw new DailyApiError(
      info ||
        error ||
        `Daily API request failed with ${response.status}.`,
      response.status,
      payload,
    );
  }

  return payload as T;
}

async function getDailyRoom(
  roomName: string,
): Promise<DailyRoom | null> {
  const response = await fetch(
    `${DAILY_API_BASE}/rooms/${encodeURIComponent(
      roomName,
    )}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${getDailyApiKey()}`,
        Accept: "application/json",
      },

      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  const raw = await response.text();

  let payload: unknown = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    throw new DailyApiError(
      `Unable to read Daily room "${roomName}".`,
      response.status,
      payload,
    );
  }

  return payload as DailyRoom;
}

export async function ensureDailyRoom(options: {
  roomName: string;
  notBefore: number;
  expiresAt: number;
}): Promise<DailyRoom> {
  const properties = {
    nbf: options.notBefore,
    exp: options.expiresAt,

    eject_at_room_exp: true,

    enable_screenshare: true,

    enable_chat: true,

    enable_recording: "cloud",

    start_video_off: false,

    start_audio_off: false,
  };

  const existing =
    await getDailyRoom(
      options.roomName,
    );

  /*
   * The room already exists.
   *
   * Update it so rooms created during development
   * also receive the latest configuration.
   */
  if (existing) {
    return dailyRequest<DailyRoom>(
      `/rooms/${encodeURIComponent(
        options.roomName,
      )}`,
      {
        method: "POST",

        body: JSON.stringify({
          privacy: "private",

          properties,
        }),
      },
    );
  }

  try {
    return await dailyRequest<DailyRoom>(
      "/rooms",
      {
        method: "POST",

        body: JSON.stringify({
          name: options.roomName,

          privacy: "private",

          properties,
        }),
      },
    );
  } catch (error) {
    /*
     * If two people join simultaneously, both
     * requests can attempt to create the same room.
     *
     * If Daily reports that the room already exists,
     * retrieve it and continue.
     */
    if (
      error instanceof DailyApiError &&
      error.status === 409
    ) {
      const racedRoom =
        await getDailyRoom(
          options.roomName,
        );

      if (racedRoom) {
        return dailyRequest<DailyRoom>(
          `/rooms/${encodeURIComponent(
            options.roomName,
          )}`,
          {
            method: "POST",

            body: JSON.stringify({
              privacy: "private",

              properties,
            }),
          },
        );
      }
    }

    throw error;
  }
}

export async function createDailyMeetingToken(
  options: {
    roomName: string;
    userId: string;
    userName?: string | null;
    role: "tutor" | "customer";
    notBefore: number;
    expiresAt: number;
  },
): Promise<string> {
  const properties: Record<
    string,
    unknown
  > = {
    /*
     * Restrict the token to this exact room.
     */
    room_name:
      options.roomName,

    /*
     * Daily user IDs have a maximum length.
     */
    user_id:
      options.userId.slice(
        0,
        36,
      ),

    user_name:
      options.userName?.trim() ||
      "Participant",

    /*
     * Participant cannot join before
     * the tutoring join window.
     */
    nbf:
      options.notBefore,

    /*
     * Participant cannot use the token
     * after the session expiration.
     */
    exp:
      options.expiresAt,

    /*
     * Automatically remove the participant
     * when their token expires.
     */
    eject_at_token_exp:
      true,

    enable_screenshare:
      true,

    start_video_off:
      false,

    start_audio_off:
      false,
  };

  /*
   * Tutors receive owner permissions and
   * therefore can control cloud recording.
   */
  if (
    options.role ===
    "tutor"
  ) {
    properties.is_owner =
      true;

    properties.enable_recording =
      "cloud";
  }

  const response =
    await dailyRequest<{
      token?: string;
    }>(
      "/meeting-tokens",
      {
        method: "POST",

        body: JSON.stringify({
          properties,
        }),
      },
    );

  if (!response.token) {
    throw new Error(
      "Daily did not return a meeting token.",
    );
  }

  return response.token;
}