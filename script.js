class Types {
	static ButtonElement = Object.freeze(document.createElement('button'));
	static String = Object.freeze(String());
}

class Indicators {
	static followers = 'seguidores';
	static following = 'seguindo';
	static states = ['Seguindo', 'Seguir', '·Seguir'];
}

class Settings {
	static observer = {childList: true, subtree: true, characterData: true};
}

class Selectors {
	static roller = `._aano`;
	static closer = `._abl-`;
	static card = `._aano > div > div > div`;
}

const buttons = {followers: Types.ButtonElement, following: Types.ButtonElement}
const totals = {followers: Types.String, following: Types.String}
const counts = {followers: 0, following: 0}

const data = {followers: [], following: []}

document.querySelectorAll('*').forEach((element) => {
	if (element.textContent.match(new RegExp(`\\d+ ${Indicators.followers}`))) {
		buttons.followers = element;
		totals.followers = Number(element.textContent.replace(Indicators.followers, ''));
	}
	if (element.textContent.match(new RegExp(`\\d+ ${Indicators.following}`))) {
		buttons.following = element;
		totals.following = Number(element.textContent.replace(Indicators.following, ''));
	}
});

Object.defineProperty(document, 'waitForElement', {
	value: function (selector) {
		return new Promise((resolve) => {
			let observer = new MutationObserver(() => {
				let element = document.querySelector(selector);
					if (element) {
						observer.disconnect();
						resolve(element);
					};
			});
	
			observer.observe(document.querySelector(':root'), Settings.observer);
		});
	}
});

function refreshData(roller, type) {
	data[type] = [];

	roller.querySelectorAll(Selectors.card).forEach((card) => {
		let texts = card.innerText.split('\n').filter((item) => !item.startsWith('·'));
		data[type].push({
			user: texts[0],
			name: texts[1]
		})
	})
	
}

function loadData(type) {
	return new Promise(async (resolve) => {
		document.querySelector(Selectors.closer)?.click();
		buttons[type].click();
	
		let delta = [Date.now()];
		let quote = undefined;

		let roller = await document.waitForElement(Selectors.roller);
		let lastCard = await document.waitForElement(Selectors.card + ':last-of-type');
	
		let observer = new MutationObserver(async () => {
			lastCard = await document.waitForElement(Selectors.card + ':last-of-type');
			lastCard.scrollIntoView();

			let previousLength = data[type].length;
			refreshData(roller, type);
			let isValid = data[type].length !== previousLength;

			if (isValid) {
				if (typeof delta === 'object' && !delta[1]) delta = Date.now() - delta[0];
				if (!quote) quote = data[type].length;

				if (typeof delta === 'number' && quote) {
					setTimeout(() => {
						resolve(data[type]);
					}, Math.round(totals[type] / quote) * delta);
				}
			}
		});
	
		lastCard.scrollIntoView();
		observer.observe(roller, Settings.observer);
	});
}

async function main() {
	let targets = [];
	let result = "";

	let followers = await loadData('followers');
	let following = await loadData('following');

	document.querySelector(Selectors.closer)?.click();

	following.forEach((followingItem) => {
		if (followers.find((followersItem) => followingItem.user === followersItem.user)) return;
		targets.push(followingItem);
	});

	targets.forEach((item) => {
		result += item.user + '<br>';
	});
	
	document.write(result);
}

main();