const Gaze = require('gaze').Gaze;
const chalk = require('chalk');
const clear = require('clear');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('hex');

function updateWatcher(directive) {
  // close previous watcher
  if (this.watcher.close) this.watcher.close();
  const action = (path) => {
    this.lastPath = path;
    if (this.clear) clear();
    directive.callback(path);
    this.instructions();
  };
  this.currentAction = action;
  // initialize new watcher with directive configuration
  this.watcher = new Gaze(this.watch);
  this.watcher.on('add', action);
  this.watcher.on('changed', action);
  console.log(`${chalk.dim('\nWatcher to ' + directive.description)}`);
};

function hookToStdin (key, action) {
  // convert key to hex
  const hexKey = key.charCodeAt(0).toString(16);
  process.stdin.on('data', (data) => {
    if (data.toString() === hexKey) {
      updateWatcher.call(this, this.directives[key]);
    };
  });
}

// static directives to exit process
process.stdin.on('data', (data) => {
  if (['03', '71'].includes(data.toString())) process.exit();
});

const Juke = function Juke(watch, defaultCallback, options={}) {
  options = Object.assign({ clear: true }, options);
  this.clear = options.clear;
  this.watch = watch;
  this.watcher = {};
  this.directives = {};
  this.currentAction = defaultCallback;
  this.lastPath = null;

  // configure initial watcher callback
  updateWatcher.call(this, { callback: defaultCallback, description: 'execute default callback' });

  process.stdin.on('data', (data) => {
    if (['0d'].includes(data.toString())) this.currentAction(this.lastPath);
  });

  return this;
};

Juke.prototype.directive = function directive(key, callback, description) {
  this.directives[key] = { callback, description };
  hookToStdin.call(this, key);
};

Juke.prototype.instructions = function instructions() {
  console.log(chalk.bold('\nWatch Usage'));
  const writeOutput = (key, description) => console.log(`${chalk.dim(' \u203A Press')} ${key} ${chalk.dim('to ' + description)}`);
  Object.keys(this.directives).sort().forEach((key) => {
    writeOutput(key, this.directives[key].description)
  });
  writeOutput('q', 'exit');
  writeOutput('Enter', 'execute');
};

module.exports = Juke;
