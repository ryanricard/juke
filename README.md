# juke

File watcher utility that provides interface to change processing behavior during watch session.

Inspired by `jest --watch`.

The dream: A reusable utility that enables engineers to quickly toggle watcher behavior during development.

Run the [juke example implementation](https://github.com/ryanricard/juke/tree/master/example)

**Example Usage:**

```js
const CLIEngine = require("eslint").CLIEngine;
const formatter = require('eslint/lib/formatters/stylish')
const Juke = require('../../index.js');

const SOURCE_PATHS = [__dirname + '/app/**/*.js'];

const lint = (paths) => {
  console.log('Linting...');
  const cli = new CLIEngine();
  const report = cli.executeOnFiles(paths);
  console.log(formatter(report.results));
  console.log('done.');
};

const lintAll = lint.bind(null, SOURCE_PATHS);
const lintChanged = (path) => lint([path]);

// instantiate juke
const juke = new Juke(SOURCE_PATHS, lintAll);

// press "o" to lint only files that change
juke.directive('o', lintChanged, 'only lint changed files');

// press "a" to lint all source files
juke.directive('a', lintAll, 'lint all files on file change');
```
