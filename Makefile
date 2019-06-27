CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 22.2.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
