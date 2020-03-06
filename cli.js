#!/usr/bin/env node

const commander = require('commander');
const programm = require('./index');
const {resolve} = require('path');

commander.arguments('[presentationPath]')
	.option('-s, --screensPath [screensPath]', 'screensPath folder')
	.action(function(presentationPath = './presentationPath', {screensPath = './screensPath'}) {
		programm({
			presentationPath: resolve(presentationPath),
			screensPath: resolve(screensPath)
		});
	})
	.parse(process.argv);