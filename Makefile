CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 12.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
