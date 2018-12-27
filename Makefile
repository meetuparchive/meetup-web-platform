CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 18.2.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
