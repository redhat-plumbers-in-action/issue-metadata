export function parseMetadata(
  body: string,
  key: string | undefined,
  regexp: RegExp
) {
  const match = body.match(regexp);

  if (match) {
    const data = JSON.parse(match[1]);
    return key ? data && data[key] : data;
  }
}

export function getBodyAndMetadata(body: string, regexp: RegExp) {
  let metadata: unknown;

  let issue = body.replace(regexp, (_, json) => {
    metadata = JSON.parse(json);
    return '';
  });

  if (!metadata) metadata = {};

  return { body: issue, metadata };
}

export function assignNewMetadata(
  metadata: Record<string, string | string[] | Record<string, string>[]>,
  key: string | object,
  value?: string | undefined
) {
  if (typeof key === 'object') {
    Object.assign(metadata, key);
    return metadata;
  }

  return { ...metadata, [key]: value ? value : '' };
}
