CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 12.4.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
