CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 13.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
