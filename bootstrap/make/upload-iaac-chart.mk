##@ Build Artifacts

IAAC_CHART_REPO ?= ../iaac

.PHONY: upload-iaac-chart
upload-iaac-chart: check-env ## Package and push iaac-git-sync Helm chart to OCI registry
	@echo "$(BOLD)Ensuring Quay repository for iaac-git-sync chart...$(RESET)"
	@curl -sf -X POST \
	  -H "Authorization: Bearer $(OCI_REGISTRY_TOKEN)" \
	  -H "Content-Type: application/json" \
	  -d '{"repository":"iaac-git-sync","visibility":"private","description":"IAAC Git Sync StatefulSet Helm chart","namespace":"$(OCI_NAMESPACE)"}' \
	  "https://$(OCI_HOST)/api/v1/repository" > /dev/null 2>&1 \
	  && printf "  $(GREEN)✓$(RESET)  Repository created (or exists)\n" \
	  || printf "  $(GREEN)✓$(RESET)  Repository already exists\n"
	@echo "$(OCI_REGISTRY_TOKEN)" | helm registry login "$(OCI_HOST)" \
	  --username='$$oauthtoken' --password-stdin > /dev/null 2>&1
	$(call ok,Logged in to $(OCI_HOST))
	@helm package $(IAAC_CHART_REPO)/helm -d /tmp/helm-pkg > /dev/null
	@CHART_VER=$$(grep '^version:' $(IAAC_CHART_REPO)/helm/Chart.yaml | awk '{print $$2}'); \
	 helm push /tmp/helm-pkg/iaac-git-sync-$${CHART_VER}.tgz oci://$(OCI_HOST)/$(OCI_NAMESPACE)
	$(call ok,iaac-git-sync chart pushed)
