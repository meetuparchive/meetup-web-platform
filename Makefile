CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 25.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
