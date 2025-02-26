import { request } from '@octokit/request';

import { assignNewMetadata, getBodyAndMetadata, parseMetadata } from './util';

import type { Metadata, MetadataObject, RequestDetails } from './schema';
import { idSchema, metadataObjectSchema, requestDetailsSchema } from './schema';

export type { RequestDetails };

export default class MetadataController {
  private readonly requestDefaults: RequestDetails;
  private readonly schema: Metadata;
  readonly regexp: RegExp;

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

  async getMetadata(issue: number): Promise<MetadataObject | undefined>;
  async getMetadata(
    issue: number,
    key: string
  ): Promise<MetadataObject | undefined>;
  async getMetadata(
    issue: number,
    key: string
  ): Promise<MetadataObject | undefined>;
  async getMetadata(
    issue: number,
    key?: string
  ): Promise<MetadataObject | undefined> {
    const body =
      (
        await request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          ...this.requestDefaults,
          issue_number: issue,
        })
      ).data.body || '';

    return parseMetadata(body, key, this.regexp);
  }

  async setMetadata(issue: number, key: object): Promise<MetadataObject>;
  async setMetadata(
    issue: number,
    key: string,
    value: string
  ): Promise<MetadataObject>;
  async setMetadata(
    issue: number,
    key: string | object,
    value?: string
  ): Promise<MetadataObject> {
    let issueBody =
      (
        await request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          ...this.requestDefaults,
          issue_number: issue,
        })
      ).data.body || '';

    let { body, metadata } = getBodyAndMetadata(issueBody, this.regexp);

    const parsedMetadata = metadataObjectSchema.parse(metadata);

    const trimmedBody = body.trim();
    const newMetadata = assignNewMetadata(parsedMetadata, key, value);

    await request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      ...this.requestDefaults,
      issue_number: issue,
      body: `${trimmedBody}\n\n${this.schema.template.before}${
        this.schema.id
      } = ${JSON.stringify(newMetadata)}${this.schema.template.after}`,
    });

    return newMetadata;
  }
}
