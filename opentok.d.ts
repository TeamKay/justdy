declare global {
  interface Window {
    OT: typeof OT;
  }
}

declare namespace OT {
  type OTEvent = {
    type: string;
    target?: unknown;
    [key: string]: unknown;
  };

  export interface Session {
    on(event: string, callback: (event: OTEvent) => void): void;
    connect(token: string, callback?: (error?: Error) => void): void;
    disconnect(): void;
    publish(publisher: Publisher, callback?: (error?: Error) => void): void;
    subscribe(
      stream: Stream,
      targetElement: string | HTMLElement,
      properties?: Record<string, unknown>,
      callback?: (error?: Error) => void,
    ): void;
    unpublish(publisher: Publisher): void;
  }

  export interface Publisher {
    on(event: string, callback: (event: OTEvent) => void): void;
    destroy(): void;
    publishAudio(enabled: boolean): void;
    publishVideo(enabled: boolean): void;
  }

  export interface Stream {
    streamId: string;
    connection: unknown;
    name: string;
    hasAudio: boolean;
    hasVideo: boolean;
  }

  export function initSession(
    apiKey: string | undefined,
    sessionId: string,
  ): Session;

  export function initPublisher(
    targetElement?: string | HTMLElement,
    properties?: Record<string, unknown>,
    callback?: (error?: Error) => void,
  ): Publisher;
}

// declare global {
//   interface Window {
//     OT: typeof OT;
//   }
// }

// declare namespace OT {
//   export interface Session {
//     on(event: string, callback: (event: any) => void): void;
//     connect(token: string, callback?: (error?: Error) => void): void;
//     disconnect(): void;
//     publish(publisher: Publisher, callback?: (error?: Error) => void): void;
//     subscribe(
//       stream: Stream,
//       targetElement: string | HTMLElement,
//       properties?: object,
//       callback?: (error?: Error) => void,
//     ): void;
//     unpublish(publisher: Publisher): void;
//   }

//   export interface Publisher {
//     on(event: string, callback: (event: any) => void): void;
//     destroy(): void;
//     publishAudio(enabled: boolean): void;
//     publishVideo(enabled: boolean): void;
//   }

//   export interface Stream {
//     streamId: string;
//     connection: object;
//     name: string;
//     hasAudio: boolean;
//     hasVideo: boolean;
//   }

//   // Initializers
//   export function initSession(
//     apiKey: string | undefined,
//     sessionId: string,
//   ): Session;
//   export function initPublisher(
//     targetElement?: string | HTMLElement,
//     properties?: object,
//     callback?: (error?: Error) => void,
//   ): Publisher;
// }
