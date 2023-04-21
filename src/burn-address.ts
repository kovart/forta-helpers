const BURN_ADDRESSES = new Set(
  [
    '0x00000000000000000000045261d4ee77acdb3286',
    '0x0123456789012345678901234567890123456789',
    '0x1234567890123456789012345678901234567890',
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
    '0x3333333333333333333333333333333333333333',
    '0x4444444444444444444444444444444444444444',
    '0x5555555555555555555555555555555555555555',
    '0x6666666666666666666666666666666666666666',
    '0x7777777777777777777777777777777777777777',
    '0x8888888888888888888888888888888888888888',
    '0x9999999999999999999999999999999999999999',
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '0xdead000000000000000042069420694206942069',
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    '0xffffffffffffffffffffffffffffffffffffffff',
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '0x000000000000000000000000000000000000dEaD',
  ].map((a) => a.toLowerCase()),
);

export function isBurnAddress(address: string) {
  return BURN_ADDRESSES.has(address.toLowerCase()) || address.indexOf('00000000000000') > -1;
}
