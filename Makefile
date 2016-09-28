NPM_TOKEN ?= '00000000-0000-0000-0000-000000000000'
CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 0.2.$(CI_BUILD_NUMBER)

test:
	npm install
	npm test

package:
	docker run \
		-t \
		-e CI_BUILD_NUMBER=$(CI_BUILD_NUMBER) \
		-e NPM_TOKEN=$(NPM_TOKEN) \
		-v $(PWD):/usr/src/app \
		-w /usr/src/app \
		node:6 \
		make test

version:
	@echo $(VERSION)

