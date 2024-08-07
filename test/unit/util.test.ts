import { beforeEach, describe, expect, test } from 'vitest';

import MetadataController from '../../src';
import {
  assignNewMetadata,
  getBodyAndMetadata,
  parseMetadata,
} from '../../src/util';

import { MetadataObject } from '../../src/schema';

const body = {
  simple: `Some text, bla bla bla\n\n<!-- util_test = {"foo":"bar"} -->`,
  complex: `Some text, bla bla bla\n\n<!-- util_test = {"foo":"bar","bar":"baz","array":["a","b"],"arrayObject":[{"a":"b"},{"foo":"bar"}]} -->`,
};

let controller: MetadataController;

describe('Test utility functions', () => {
  beforeEach(() => {
    controller = new MetadataController('util_test', {
      owner: 'owner',
      repo: 'repo',
      headers: {
        authorization: 'token',
      },
    });
  });

  test('parseMetadata()', () => {
    let metadata = parseMetadata(body.simple, undefined, controller.regexp);
    expect(metadata).toMatchInlineSnapshot(`
      {
        "foo": "bar",
      }
    `);

    metadata = parseMetadata(body.simple, 'foo', controller.regexp);
    expect(metadata).toMatchInlineSnapshot(`"bar"`);

    expect(parseMetadata(body.complex, undefined, controller.regexp))
      .toMatchInlineSnapshot(`
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
    expect(
      parseMetadata(body.complex, 'foo', controller.regexp)
    ).toMatchInlineSnapshot(`"bar"`);
    expect(parseMetadata(body.complex, 'array', controller.regexp))
      .toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `);
    expect(parseMetadata(body.complex, 'arrayObject', controller.regexp))
      .toMatchInlineSnapshot(`
      [
        {
          "a": "b",
        },
        {
          "foo": "bar",
        },
      ]
    `);
  });

  test('getBodyAndMetadata()', () => {
    let result = getBodyAndMetadata(body.simple, controller.regexp);
    expect(result.body).toMatchInlineSnapshot(`
      "Some text, bla bla bla

      "
    `);
    expect(result.metadata).toMatchInlineSnapshot(`
      {
        "foo": "bar",
      }
    `);

    result = getBodyAndMetadata(body.complex, controller.regexp);
    expect(result.body).toMatchInlineSnapshot(`
      "Some text, bla bla bla

      "
    `);
    expect(result.metadata).toMatchInlineSnapshot(`
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
  });

  test('assignNewMetadata()', () => {
    let metadata = {
      array: ['a', 'b'],
      arrayObject: [{ a: 'b' }, { foo: 'bar' }],
      bar: 'baz',
      foo: 'bar',
    } as MetadataObject;

    let result = assignNewMetadata(metadata, 'bar', 'baz');
    expect(result).toMatchInlineSnapshot(`
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
    expect(result['bar']).toMatchInlineSnapshot(`"baz"`);

    result = assignNewMetadata(metadata, { bar: ['a', 'b', 'c'] });
    expect(result).toMatchInlineSnapshot(`
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
        "bar": [
          "a",
          "b",
          "c",
        ],
        "foo": "bar",
      }
    `);
    expect(result['bar']).toMatchInlineSnapshot(`
      [
        "a",
        "b",
        "c",
      ]
    `);
  });
});
