// The URI can have the following formats:
// QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o
// /ipfs/QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o
// ://QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o
// ipfs://QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o/0.json
// https://ipfs.io/ipfs/QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o
// http://bafybeie5gq4jxvzmsym6hjlwxej4rwdoxt7wadqvmmwbqi7r27fclha2va.dweb.link
// https://site.com/test.json#234?a=3
export function normalizeMetadataUri(
  uri: string,
  gatewayUrl: string = 'https://ipfs.io/ipfs/',
): string | null {
  if (uri.indexOf('ipfs://') === 0) {
    return uri.replace('ipfs://', gatewayUrl);
  } else if (uri.indexOf('://') === 0) {
    return uri.replace('://', gatewayUrl);
  } else if (uri.indexOf('://ipfs/')) {
    return uri.replace('://ipfs/', gatewayUrl);
  } else if (uri.indexOf('/ipfs/') === 0) {
    return uri.replace('/ipfs/', gatewayUrl);
  } else if (isCid(uri)) {
    return gatewayUrl + uri;
  } else if (containsLink(uri)) {
    return uri;
  }

  return null;
}

export function isBase64(str: string) {
  return str.trim().indexOf('data:application/json') === 0;
}

export function containsLink(str: string): boolean {
  return /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(
    str,
  );
}

export function isCid(str: string) {
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})$/.test(
    str,
  );
}
