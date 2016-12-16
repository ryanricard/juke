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
  this.currentDirective = directive;
  this.currentDirective.action = action;
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
  this.currentDirective = null;
  this.lastPath = null;

  // configure initial watcher callback
  updateWatcher.call(this, { callback: defaultCallback, description: 'execute default callback' });

  process.stdin.on('data', (data) => {
    try {
      if (['0d'].includes(data.toString())) this.currentDirective.action(this.lastPath);
    } catch(err) {
      if (/Path must be a string/.test(err.message)) {
        console.log(chalk.yellow('No files have changed yet.'));
      } else {
        console.log(`${chalk.yellow('Oops.')} Something unfortunate happened when juke attempted to ${this.currentDirective.description}`);
      }
      this.instructions();
    }
  });

  process.nextTick(this.currentDirective.action);

  return this;
};

Juke.prototype.directive = function directive(key, callback, description) {
  this.directives[key] = { callback, description };
  hookToStdin.call(this, key);
};

Juke.prototype.instructions = function instructions() {
  console.log(chalk.bold(`juke watch`));
  const writeOutput = (key, description) => console.log(`${chalk.dim(' \u25B8 Press')} ${key} ${chalk.dim('to ' + description)}`);
  Object.keys(this.directives).sort().forEach((key) => {
    writeOutput(key, this.directives[key].description)
  });
  writeOutput('q', 'exit');
  writeOutput('Enter', 'execute');
};

module.exports = Juke;
