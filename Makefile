CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 0.11.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)

