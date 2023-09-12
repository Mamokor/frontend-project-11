install:
		npm ci
lint:
		npx eslint .
webpack:
		npx webpack serve
build:
	rm -rf dist
	NODE_ENV=production npx webpack
install-deps:
	npm install
test:
	npm test
publish:
	npm publish