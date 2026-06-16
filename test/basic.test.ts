import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import MetadataController from '../src/index';

const mocks = vi.hoisted(() => {
  return {
    request: vi.fn(),
  };
});

vi.mock('@octokit/request', async () => {
  const actual = await vi.importActual('@octokit/request');
  const request = mocks.request;
  return { ...(actual as any), request };
});

const owner = 'redhat-plumbers-in-action';
const repo = 'issue-metadata';
const issueNumber = 2;
const token = '0000000000000000000000000000000000000001';
const metadata = new MetadataController('metadata_id', {
  owner,
  repo,
  headers: {
    authorization: `token ${token}`,
  },
});

describe('Integration tests ', () => {
  beforeEach(async () => {
    // Mock GitHub API
    vi.mocked(mocks.request)
      // GET /repos/{owner}/{repo}/issues/{issue_number}
      .mockResolvedValueOnce({
        status: 200,
        data: {
          body: `I'm having a problem with this. Please HELP!!! :sos: \n\n<!-- metadata_id = {"bar":["foo","baz"]} -->`,
        },
      })
      // PATCH /repos/{owner}/{repo}/issues/{issue_number}
      .mockResolvedValueOnce({
        status: 200,
        data: {
          body: `I'm having a problem with this. Please HELP!!! :sos: \n\n<!-- metadata_id = {"bar":["foo","baz"],"foo":["a","b"]} -->`,
        },
      })
      // GET /repos/{owner}/{repo}/issues/{issue_number}
      .mockResolvedValueOnce({
        status: 200,
        data: {
          body: `I'm having a problem with this. Please HELP!!! :sos: \n\n<!-- metadata_id = {"foo":["a","b"]} -->`,
        },
      });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  test('Set and Get Metadata using Controller', async () => {
    expect(metadata).toBeInstanceOf(MetadataController);

    expect(await metadata.setMetadata(issueNumber, 'foo', `['a', 'b']`))
      .toMatchInlineSnapshot(`
      {
        "bar": [
          "foo",
          "baz",
        ],
        "foo": "['a', 'b']",
      }
    `);

    const data = metadata.getMetadata(issueNumber, 'foo');
    expect(await data).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `);
  });
});

describe('Skip write optimization', () => {
  beforeEach(async () => {
    mocks.request.mockReset();
  });

  test('skips PATCH when resulting body is identical', async () => {
    const body = `Issue body\n\n<!-- metadata_id = {"foo":"bar"} -->`;

    vi.mocked(mocks.request).mockResolvedValueOnce({
      status: 200,
      data: { body },
    });

    const result = await metadata.setMetadata(issueNumber, 'foo', 'bar');
    expect(result).toEqual({ foo: 'bar' });
    expect(mocks.request).toHaveBeenCalledTimes(1);
    expect(mocks.request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/issues/{issue_number}',
      expect.anything()
    );
  });

  test('writes when metadata changed', async () => {
    const body = `Issue body\n\n<!-- metadata_id = {"foo":"bar"} -->`;

    vi.mocked(mocks.request)
      .mockResolvedValueOnce({ status: 200, data: { body } })
      .mockResolvedValueOnce({ status: 200, data: { body } });

    const result = await metadata.setMetadata(issueNumber, 'foo', 'updated');
    expect(result).toEqual({ foo: 'updated' });
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(mocks.request).toHaveBeenLastCalledWith(
      'PATCH /repos/{owner}/{repo}/issues/{issue_number}',
      expect.objectContaining({
        body: `Issue body\n\n<!-- metadata_id = {"foo":"updated"} -->`,
      })
    );
  });

  test('preserves body formatting when metadata exists and is unchanged', async () => {
    const body = `Issue body  \n\n\n\n<!-- metadata_id = {"foo":"bar"} -->`;

    vi.mocked(mocks.request).mockResolvedValueOnce({
      status: 200,
      data: { body },
    });

    const result = await metadata.setMetadata(issueNumber, 'foo', 'bar');
    expect(result).toEqual({ foo: 'bar' });
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

  test('replaces metadata in-place when content exists after it', async () => {
    const body = `Issue body\n\n<!-- metadata_id = {"foo":"bar"} -->\n\n## Summary by CodeRabbit\nSome content`;

    vi.mocked(mocks.request)
      .mockResolvedValueOnce({ status: 200, data: { body } })
      .mockResolvedValueOnce({ status: 200, data: {} });

    const result = await metadata.setMetadata(issueNumber, 'foo', 'updated');
    expect(result).toEqual({ foo: 'updated' });
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(mocks.request).toHaveBeenLastCalledWith(
      'PATCH /repos/{owner}/{repo}/issues/{issue_number}',
      expect.objectContaining({
        body: `Issue body\n\n<!-- metadata_id = {"foo":"updated"} -->\n\n## Summary by CodeRabbit\nSome content`,
      })
    );
  });

  test('appends metadata with trimmed body when no metadata exists', async () => {
    const body = `Issue body  \n\n\n`;

    vi.mocked(mocks.request)
      .mockResolvedValueOnce({ status: 200, data: { body } })
      .mockResolvedValueOnce({ status: 200, data: {} });

    const result = await metadata.setMetadata(issueNumber, 'foo', 'bar');
    expect(result).toEqual({ foo: 'bar' });
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(mocks.request).toHaveBeenLastCalledWith(
      'PATCH /repos/{owner}/{repo}/issues/{issue_number}',
      expect.objectContaining({
        body: `Issue body\n\n<!-- metadata_id = {"foo":"bar"} -->`,
      })
    );
  });
});
