CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 22.4.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
