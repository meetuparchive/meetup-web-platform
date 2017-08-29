CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 7.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
