CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 2.6.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)

