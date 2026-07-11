.PHONY: check-env
check-env:
	@missing=0; \
	for var in $(REQUIRED_VARS); do \
	  eval val=\$$$$var; \
	  if [ -z "$$val" ]; then echo "MISSING: $$var"; missing=1; fi; \
	done; \
	if [ $$missing -eq 1 ]; then exit 1; fi; \
	echo "All required environment variables are set."
