CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 12.1.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
