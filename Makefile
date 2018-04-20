CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 15.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
