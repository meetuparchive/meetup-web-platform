CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 26.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
