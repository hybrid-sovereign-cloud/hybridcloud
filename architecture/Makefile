.DEFAULT_GOAL := help

HARDENING_DIR := hardeningcheck

BOLD  := $(shell tput bold 2>/dev/null || echo "")
GREEN := $(shell tput setaf 2 2>/dev/null || echo "")
YELLOW:= $(shell tput setaf 3 2>/dev/null || echo "")
RED   := $(shell tput setaf 1 2>/dev/null || echo "")
RESET := $(shell tput sgr0 2>/dev/null || echo "")

##@ Hardening Checks

.PHONY: hardening-check
hardening-check: ## Run all hardening checks (summary view)
	@echo "$(BOLD)═══ Sovereign Cloud Hardening Check ═══$(RESET)"
	@echo ""
	@for f in $(HARDENING_DIR)/*.md; do \
	  name=$$(basename "$$f" .md); \
	  [ "$$name" = "security-assessment" ] && continue; \
	  pass=$$(grep -c '| PASS |' "$$f" 2>/dev/null || echo 0); \
	  review=$$(grep -c '| REVIEW |' "$$f" 2>/dev/null || echo 0); \
	  todo=$$(grep -c '| TODO |' "$$f" 2>/dev/null || echo 0); \
	  recommended=$$(grep -c '| RECOMMENDED |' "$$f" 2>/dev/null || echo 0); \
	  total=$$((pass + review + todo + recommended)); \
	  if [ "$$review" -gt 0 ] || [ "$$todo" -gt 0 ]; then \
	    status="$(YELLOW)REVIEW$(RESET)"; \
	  else \
	    status="$(GREEN)PASS$(RESET)"; \
	  fi; \
	  printf "  %-30s %s  ($(GREEN)%d$(RESET) pass, $(YELLOW)%d$(RESET) review, $(RED)%d$(RESET) todo)\n" "$$name" "$$status" "$$pass" "$$review" "$$todo"; \
	done
	@echo ""
	@echo "$(BOLD)Full assessment: $(HARDENING_DIR)/security-assessment.md$(RESET)"

.PHONY: hardening-check-rhacm
hardening-check-rhacm: ## Show RHACM hardening checks
	@cat $(HARDENING_DIR)/rhacm.md

.PHONY: hardening-check-rhbk
hardening-check-rhbk: ## Show Keycloak (RHBK) hardening checks
	@cat $(HARDENING_DIR)/rhbk.md

.PHONY: hardening-check-acs
hardening-check-acs: ## Show ACS hardening checks
	@cat $(HARDENING_DIR)/acs.md

.PHONY: hardening-check-vault
hardening-check-vault: ## Show Vault hardening checks
	@cat $(HARDENING_DIR)/vault.md

.PHONY: hardening-check-aap
hardening-check-aap: ## Show AAP hardening checks
	@cat $(HARDENING_DIR)/aap.md

.PHONY: hardening-check-odf
hardening-check-odf: ## Show ODF/Noobaa hardening checks
	@cat $(HARDENING_DIR)/odf.md

.PHONY: hardening-check-quay
hardening-check-quay: ## Show Quay hardening checks
	@cat $(HARDENING_DIR)/quay.md

.PHONY: hardening-check-crunchy-postgres
hardening-check-crunchy-postgres: ## Show Crunchy Postgres hardening checks
	@cat $(HARDENING_DIR)/crunchy-postgres.md

.PHONY: hardening-check-gitea
hardening-check-gitea: ## Show Gitea hardening checks
	@cat $(HARDENING_DIR)/gitea.md

.PHONY: hardening-check-external-secrets
hardening-check-external-secrets: ## Show External Secrets hardening checks
	@cat $(HARDENING_DIR)/external-secrets.md

.PHONY: hardening-check-sovereign-namespaces
hardening-check-sovereign-namespaces: ## Show Sovereign Namespaces hardening checks
	@cat $(HARDENING_DIR)/sovereign-namespaces.md

##@ Help

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BOLD)Usage:$(RESET)\n  make $(GREEN)<target>$(RESET)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-35s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) }' $(MAKEFILE_LIST)
