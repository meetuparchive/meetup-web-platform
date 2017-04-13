CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 2.1.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)

