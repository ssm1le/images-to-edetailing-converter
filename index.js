const fs = require('fs');
const { join } = require('path');
const fse = require('fs-extra');
const jimp = require('jimp');
const execa = require('execa');
const rimraf = require('rimraf');

const Listr = require('listr');

module.exports = async function ({ presentationPath, screensPath}) {

	const imagesArray = fs.readdirSync(screensPath).filter(image => /.(png|jpg)$/.test(image));

	imagesArray.sort(function (a, b) {
		if (a.length === b.length) {
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}
		return a.length < b.length ? -1 : 1;
	});

	const tasks = new Listr([
		{
			title: 'clone master template',
			task: _ => cloneMaster(presentationPath)
		},
		{
			title: 'update presentation',
			task: _ => new Listr([
				{
					title: 'copy images',
					task: _ => copyimagesArray(presentationPath, screensPath, imagesArray)
				},
				{
					title: 'update structure',
					task: _ => updatemplateructure(presentationPath, imagesArray)
				}


			], {
				concurrent: true
			})
		},
		{
			title: 'init repo',
			task: _=> initRepo(presentationPath)
		}
	]);

	tasks.run().catch(error => {
		console.error(error);
	})
}

function copyimagesArray(presentationPath, screensPath, imagesArray) {
	const appPath = join(presentationPath, 'app');
	return Promise.all(
		imagesArray.map(async (imageName, i) => {
			const slideId = `slide${i + 1}`;

			await generateSlide(appPath, slideId);
			await generateImage(appPath, imageName, screensPath, slideId);
		})
	);
}

async function generateImage(appPath, imageName, screensPath, slideId) {
	const slideImagesPath = join(appPath, 'media', 'images', slideId);
	const thumbsPath = join(appPath, 'media', 'images', 'common', 'thumbs');
	const image = await jimp.read(join(screensPath, imageName));

	await image
		.clone()
		.quality(100)
		.write(join(slideImagesPath, 'bg.jpg'));

	await image
		.quality(100)
		.resize(400, jimp.AUTO)
		.write(join(thumbsPath, `${slideId}.jpg`));
}

async function generateSlide(appPath, slideId) {
	await generateHtml(appPath, slideId);
	await generateCss(appPath, slideId);
	await generateModel(appPath, slideId);
	await generateI18n(appPath, slideId);
}

async function generateHtml(appPath, slideId) {
	fse.copySync(join(__dirname, 'slideScaffolding', 'html'), appPath);
	fse.renameSync(join(`${appPath}`, 'template.html'), join(`${appPath}`, `${slideId}.html`));

	const slideHtml = await fse.readFile(join(`${appPath}`, `${slideId}.html`), 'utf-8');
	const newSlideHtml = slideHtml.replace('template\.css', `${slideId}.css`);
	await fse.writeFile(join(`${appPath}`, `${slideId}.html`), newSlideHtml);
}

async function generateCss(appPath, slideId) {
	const cssPath = join(appPath, 'styles');
	fse.copySync(join(__dirname, 'slideScaffolding', 'css'), cssPath);
	fse.renameSync(join(`${cssPath}`, 'template.css'), join(`${cssPath}`, `${slideId}.css`));
}

async function generateModel(appPath, slideId) {
	const modelPath = join(appPath, 'data', 'models');
	fse.copySync(join(__dirname, 'slideScaffolding', 'model'), modelPath);
	fse.renameSync(join(`${modelPath}`, 'template.json'), join(`${modelPath}`, `${slideId}.json`));

	const slideModel = fse.readJSONSync(join(`${modelPath}`, `${slideId}.json`));
	slideModel.bg.src = slideModel.bg.src.replace('template', `${slideId}`);
	fse.writeJSONSync(join(`${modelPath}`, `${slideId}.json`), slideModel);
}

async function generateI18n(appPath, slideId) {
	const i18nPath = join(appPath, 'i18n', 'en');
	fse.copySync(join(__dirname, 'slideScaffolding', 'i18n'), i18nPath);
	fse.renameSync(join(`${i18nPath}`, 'template.json'), join(`${i18nPath}`, `${slideId}.json`));
}

async function updatemplateructure(presentationPath, imagesArray) {
	const structure = await fse.readJSON(join(presentationPath, 'structure.json'));

	structure.slides = {
		...structure.slides,
		...imagesArray.reduce((slides, image, i) => {
			const slideID = `slide${i + 1}`;
			slides[slideID] = {
				name: `Slide ${i + 1}`,
				title: `Slide ${i + 1}`,
				template: `${slideID}.html`
			};
			return slides;
		}, {}),
	}

	structure.chapters.core.content = imagesArray.map((image, i) => `slide${i + 1}`);

	return fse.writeJSON(join(presentationPath, 'structure.json'), structure, { spaces: '\t' });
}

async function cloneMaster(presentationPath) {
	await execa.command(`git clone git@git.qapint.com:m.molodetskiy/cobalt-template.git ${presentationPath}`)
	rimraf.sync(join(presentationPath, '.git'));
}

async function initRepo(presentationPath) {
	await execa.command('git init', { cwd: presentationPath });
	await execa.command('git add -A', { cwd: presentationPath });
	await execa("git", ['commit', '-m', 'initial commit'], { cwd: presentationPath });
	await execa.command('git checkout -b develop', { cwd: presentationPath });
}