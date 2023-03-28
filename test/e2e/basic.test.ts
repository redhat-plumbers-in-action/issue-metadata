import fetchMock from 'fetch-mock';
import { describe, expect, test } from 'vitest';

import MetadataController from '../../src/index';

describe('e2e', () => {
  const owner = 'redhat-plumbers-in-action';
  const repo = 'issue-metadata';
  const issueNumber = 2;
  const token = '0000000000000000000000000000000000000001';

  let getMock = fetchMock.sandbox().mock(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      url: 'https://api.github.com/repos/redhat-plumbers-in-action/issue-metadata/issues/2',
      number: 2,
      title: 'Test issue :test_tube: ',
      labels: [],
      state: 'open',
      locked: false,
      assignee: null,
      assignees: [],
      milestone: null,
      comments: 0,
      created_at: '2023-03-28T08:39:16Z',
      updated_at: '2023-03-28T08:39:16Z',
      closed_at: null,
      body: "I'm having a problem with this. Please HELP!!! :sos: ",
    },
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `token ${token}`,
      },
    }
  );

  const patchMock = fetchMock.sandbox().mock(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      url: 'https://api.github.com/repos/redhat-plumbers-in-action/issue-metadata/issues/2',
      number: 2,
      title: 'Test issue :test_tube: ',
      labels: [],
      state: 'open',
      locked: false,
      assignee: null,
      assignees: [],
      milestone: null,
      comments: 0,
      created_at: '2023-03-28T08:39:16Z',
      updated_at: '2023-03-28T08:39:16Z',
      closed_at: null,
      body: `I'm having a problem with this. Please HELP!!! :sos: \n\n<!-- metadata_id = {"foo":"bar"} -->`,
    },
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `token ${token}`,
      },
      method: 'PATCH',
    }
  );

  const metadata = new MetadataController('metadata_id', {
    owner,
    repo,
    headers: {
      authorization: `token ${token}`,
    },
  });

  test('Set and Get Metadata using Controller', async () => {
    expect(metadata).toBeInstanceOf(MetadataController);

    expect(
      await metadata.setMetadata(issueNumber, 'foo', 'bar', {
        get: getMock,
        patch: patchMock,
      })
    ).toMatchInlineSnapshot(`
      {
        "foo": "bar",
      }
    `);

    getMock = fetchMock.sandbox().mock(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        url: 'https://api.github.com/repos/redhat-plumbers-in-action/issue-metadata/issues/2',
        number: 2,
        title: 'Test issue :test_tube: ',
        labels: [],
        state: 'open',
        locked: false,
        assignee: null,
        assignees: [],
        milestone: null,
        comments: 0,
        created_at: '2023-03-28T08:39:16Z',
        updated_at: '2023-03-28T08:39:16Z',
        closed_at: null,
        body: `I'm having a problem with this. Please HELP!!! :sos: \n\n<!-- metadata_id = {"foo":"bar"} -->`,
      },
      {
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: `token ${token}`,
        },
      }
    );

    const data = metadata.getMetadata(issueNumber, 'foo', getMock);
    expect(await data).toMatchInlineSnapshot('"bar"');
  });
});
