# Issue Metadata

[![npm version][npm-status]][npm] [![Tests][test-status]][test] [![Linters][lint-status]][lint] [![CodeQL][codeql-status]][codeql] [![codecov][codecov-status]][codecov]

[npm]: https://www.npmjs.com/package/issue-metadata
[npm-status]: https://badgen.net/npm/v/issue-metadata

[test]: https://github.com/redhat-plumbers-in-action/issue-metadata/actions/workflows/tests.yml
[test-status]: https://github.com/redhat-plumbers-in-action/issue-metadata/actions/workflows/test.yml/badge.svg

[lint]: https://github.com/redhat-plumbers-in-action/issue-metadata/actions/workflows/lint.yml
[lint-status]: https://github.com/redhat-plumbers-in-action/issue-metadata/actions/workflows/lint.yml/badge.svg

[codeql]: https://github.com/redhat-plumbers-in-action/issue-metadata/actions/workflows/codeql-analysis.yml
[codeql-status]: https://github.com/redhat-plumbers-in-action/issue-metadata/actions/workflows/codeql.yml/badge.svg

[codecov]: https://app.codecov.io/gh/redhat-plumbers-in-action/issue-metadata
[codecov-status]: https://codecov.io/gh/redhat-plumbers-in-action/issue-metadata/branch/main/graph/badge.svg?token=6wUQKlQeYt

## How to use

### Creating the Metadata controller instance

```typescript
import MetadataController from "issue-metadata";

const controller = new MetadataController('my_metadata_ID', {
  owner: 'my_name',
  repo: 'my_repo',
  headers: {
    authorization: `Bearer my_GITHUB_API_TOKEN`,
  },
});
```

### Store metadata on issue

```typescript
await controller.setMetadata(1, 'foo', 'bar');
// In body of issue #1:
// <!-- my_metadata_ID = {"foo":"bar"} -->

await controller.setMetadata(1, { foo: 'bar' });
// In body of issue #1:
// <!-- my_metadata_ID = {"foo":"bar"} -->

await controller.setMetadata(1, 'complex', [{ bar: 'baz' }]);
// In body of issue #1:
// <!-- my_metadata_ID = {"complex":[{"bar":"baz"}]} -->
```

### Get metadata stored on issue

```typescript
// In body of issue #1:
// <!-- my_metadata_ID = {"foo":"bar"} -->
let metadata = await controller.getMetadata(1, 'foo');
// metadata === "bar"

// In body of issue #1:
// <!-- my_metadata_ID = {"foo":"bar"} -->
metadata = await controller.getMetadata(1);
// metadata === {foo: "bar"}

// In body of issue #1:
// <!-- my_metadata_ID = {"complex":[{"bar":"baz"}]} -->
metadata = await controller.getMetadata(1, 'complex');
// metadata === [{ bar: 'baz' }]
```

> [!IMPORTANT]
>
> In current implementation when setting metadata, it always overrides the previous metadata. For example:
>
> ```typescript
> // <!-- my_metadata_ID = {"foo":"bar", "complex":[{"bar":"baz"}]} -->
> await controller.setMetadata(1, 'complex', [{ foo: 'bar' }]);
> // In body of issue #1:
> // <!-- my_metadata_ID = {"foo":"bar", "complex":[{"foo":"bar"}]} -->
