declare module "telebirr-receipt" {
  export function loadReceipt(input: { receiptNo: string }): Promise<string>;

  export function parseFromHTML(html: string): any;

  export function receipt(
    parsed: any,
    expected: any,
  ): {
    verify: (fn: (parsed: any, expected: any) => boolean) => boolean;
    verifyAll: any;
    equals: (a: any, b: any) => boolean;
  };
}
