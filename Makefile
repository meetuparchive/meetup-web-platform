CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 17.4.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
