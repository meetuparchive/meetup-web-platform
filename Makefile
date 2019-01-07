CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 19.0.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
