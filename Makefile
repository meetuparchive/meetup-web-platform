CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 24.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
