develop:
	npx webpack serve

install:
	npm ci

build:
	rm -rf dist 
	NODE_ENV=production npx webpack

test:
	npm test

lint:
	npx eslint .
fix:
	npx eslint --fix .	
install-deps:
	npm install	
