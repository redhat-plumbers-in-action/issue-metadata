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
        before: '\n\n<!-- ',
        after: ' -->',
      },
    };

    this.regexp = new RegExp(
      `${this.schema.template.before}${verifiedID} = (.*)${this.schema.template.after}`
    );
  }

  async getMetadata(issue: number, key: string): Promise<unknown> {
    const body =
      (
        await request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          ...this.requestDefaults,
          issue_number: issue,
        })
      ).data.body || '';

    const match = body.match(this.regexp);

    if (match) {
      const data = JSON.parse(match[1]);
      return key ? data && data[key] : data;
    }
  }

  async setMetadata(issue: number, key: string, value: string) {
    let body =
      (
        await request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          ...this.requestDefaults,
          issue_number: issue,
        })
      ).data.body || '';

    let data = {};

    body = body.replace(this.regexp, (_, json) => {
      data = JSON.parse(json);
      return '';
    });

    if (!data) data = {};

    if (typeof key === 'object') {
      Object.assign(data, key);
    } else {
      (data as { [key: string]: string })[key] = value;
    }

    return request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      ...this.requestDefaults,
      issue_number: issue,
      body: `${body}${this.schema.template.before}${
        this.schema.id
      } = ${JSON.stringify(data)}${this.schema.template.after}`,
    });
  }
}
