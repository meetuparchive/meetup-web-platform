CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 12.2.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
