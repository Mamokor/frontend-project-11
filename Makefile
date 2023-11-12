install:
		npm ci
lint:
		npx eslint .
fix:
		npx eslint --fix .
webpack:
		npx webpack serve
build:
		rm -rf dist
		NODE_ENV=production npx webpack
install-deps:
		npm install

publish:
		npm publish
