CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 7.1.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
