CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 17.1.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
