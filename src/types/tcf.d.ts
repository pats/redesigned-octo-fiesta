type TcfApiCallback = (tcData: unknown, success: boolean) => void;

interface Window {
  __tcfapi?: (
    command: string,
    version: number,
    callback: TcfApiCallback,
    parameter?: unknown,
  ) => void;
}
