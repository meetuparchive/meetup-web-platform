CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 14.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
