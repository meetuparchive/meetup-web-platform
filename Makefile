CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 16.1.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
