import { beforeEach, describe, expect, test } from 'vitest';

import MetadataController from '../src';
import { assignNewMetadata, getBodyAndMetadata } from '../src/util';

import { MetadataObject } from '../src/schema';

const body = {
  complex: `Some text, bla bla bla\n\n<!-- util_test = {"foo":"bar","bar":"baz","array":["a","b"],"arrayObject":[{"a":"b"},{"foo":"bar"}]} -->`,
};

let controller: MetadataController;

describe('Test complex metadata manipulation', () => {
  beforeEach(() => {
    controller = new MetadataController('util_test', {
      owner: 'owner',
      repo: 'repo',
      headers: {
        authorization: 'token',
      },
    });
  });

  test.todo('parseMetadata()', () => {
    let currentState = getBodyAndMetadata(body.complex, controller.regexp);
    expect(currentState.metadata).toMatchInlineSnapshot(`
      {
        "array": [
          "a",
          "b",
        ],
        "arrayObject": [
          {
            "a": "b",
          },
          {
            "foo": "bar",
          },
        ],
        "bar": "baz",
        "foo": "bar",
      }
    `);

    let newMetadata = assignNewMetadata(
      currentState.metadata as MetadataObject,
      'newKey',
      '{"some": "value"}'
    );
    expect(newMetadata).toMatchInlineSnapshot(`
      {
        "array": [
          "a",
          "b",
        ],
        "arrayObject": [
          {
            "a": "b",
          },
          {
            "foo": "bar",
          },
        ],
        "bar": "baz",
        "foo": "bar",
        "newKey": "{"some": "value"}",
      }
    `);

    //! FIXME: We are currently ignoring the existing metadata and overwriting it with the new value.
    //! This was fine for simple key-value pairs, but it's not enough for complex objects.
    currentState.metadata = newMetadata;
    newMetadata = assignNewMetadata(
      currentState.metadata as MetadataObject,
      'arrayObject',
      '[{ "c": "d" }]'
    );
    expect(newMetadata).toMatchInlineSnapshot(`
      {
        "array": [
          "a",
          "b",
        ],
        "arrayObject": "[{
            "a": "b",
          },
          {
            "foo": "bar",
          },
          {
            "c": "d" 
          },
        ]",
        "bar": "baz",
        "foo": "bar",
        "newKey": "{"some": "value"}",
      }
    `);
  });
});
