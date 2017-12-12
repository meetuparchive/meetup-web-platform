CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 11.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
