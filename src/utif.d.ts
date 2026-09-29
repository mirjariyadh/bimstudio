declare module 'utif' {
  const UTIF: {
    decode(buffer: ArrayBuffer): any[];
    decodeImage(buffer: ArrayBuffer, ifd: any): void;
    toRGBA8(ifd: any): Uint8Array;
    encodeImage(rgba: Uint8Array, width: number, height: number): ArrayBuffer;
    default?: typeof UTIF;
  };

  export default UTIF;
}
