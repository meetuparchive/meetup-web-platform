CI_BUILD_NUMBER ?= $(USER)-snapshot
VERSION ?= 21.3.$(CI_BUILD_NUMBER)

version:
	@echo $(VERSION)
