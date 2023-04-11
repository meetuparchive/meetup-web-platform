CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 27.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
