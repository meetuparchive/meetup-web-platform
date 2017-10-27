CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 9.1.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
