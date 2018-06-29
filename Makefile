CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 16.6.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
