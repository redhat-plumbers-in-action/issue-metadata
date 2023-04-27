import { request } from '@octokit/request';

import type { Metadata, RequestDetails } from './schema';
import { idSchema, requestDetailsSchema } from './schema';

export type { RequestDetails };

export default class MetadataController {
  private readonly requestDefaults: RequestDetails;
  private readonly schema: Metadata;
  private readonly regexp: RegExp;

  constructor(uniqueID: string, settings: RequestDetails) {
    const verifiedID = idSchema.parse(uniqueID);
    this.requestDefaults = requestDetailsSchema.parse(settings);

    this.schema = {
      id: verifiedID,
      template: {
        before: '<!-- ',
        after: ' -->',
      },
    };

    this.regexp = new RegExp(
      `^${this.schema.template.before}${verifiedID} = (.*)${this.schema.template.after}$`,
      'm'
    );
  }

  async getMetadata(issue: number): Promise<Record<string, string> | undefined>;
  async getMetadata(
    issue: number,
    key: string
  ): Promise<Record<string, string> | undefined>;
  async getMetadata(
    issue: number,
    key: string,
    mock: unknown
  ): Promise<Record<string, string> | undefined>;
  async getMetadata(
    issue: number,
    key?: string,
    mock?: unknown
  ): Promise<Record<string, string> | undefined> {
    const requestMock = mock ? { request: { fetch: mock } } : {};

    const body =
      (
        await request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          ...this.requestDefaults,
          issue_number: issue,
          ...requestMock,
        })
      ).data.body || '';

    const match = body.match(this.regexp);

    if (match) {
      const data = JSON.parse(match[1]);
      return key ? data && data[key] : data;
    }
  }

  async setMetadata(
    issue: number,
    key: string,
    value: string
  ): Promise<Record<string, string> | never>;
  async setMetadata(
    issue: number,
    key: object
  ): Promise<Record<string, string> | never>;
  async setMetadata(
    issue: number,
    key: string,
    value: string
  ): Promise<Record<string, string> | never>;
  async setMetadata(
    issue: number,
    key: string,
    value: string,
    mock?: { get: unknown; patch: unknown }
  ): Promise<Record<string, string> | never>;
  async setMetadata(
    issue: number,
    key: string | object,
    value?: string,
    mock?: { get: unknown; patch: unknown }
  ): Promise<Record<string, string> | never> {
    const requestMock = mock
      ? {
          get: { request: { fetch: mock.get } },
          patch: { request: { fetch: mock.patch } },
        }
      : {};

    let body =
      (
        await request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          ...this.requestDefaults,
          issue_number: issue,
          ...requestMock.get,
        })
      ).data.body || '';

    let data: { [key: string]: string } = {};

    body = body.replace(this.regexp, (_, json) => {
      data = JSON.parse(json);
      return '';
    });

    if (!data) data = {};

    if (typeof key === 'object') {
      Object.assign(data, key);
    } else {
      data[key] = value ? value : '';
    }

    await request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      ...this.requestDefaults,
      issue_number: issue,
      body: `${body}\n\n${this.schema.template.before}${
        this.schema.id
      } = ${JSON.stringify(data)}${this.schema.template.after}`,
      ...requestMock.patch,
    });

    return data;
  }
}
