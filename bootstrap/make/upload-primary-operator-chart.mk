##@ Build Artifacts

PRIMARY_OPERATOR_CHART_REPO ?= ../operator/primary

.PHONY: upload-primary-operator-chart
upload-primary-operator-chart: check-env ## Package and push hybridsovereign-primary-operator Helm chart to OCI registry
	@echo "$(BOLD)Ensuring Quay repository for hybridsovereign-primary-operator chart...$(RESET)"
	@curl -sf -X POST \
	  -H "Authorization: Bearer $(OCI_REGISTRY_TOKEN)" \
	  -H "Content-Type: application/json" \
	  -d '{"repository":"hybridsovereign-primary-operator","visibility":"private","description":"HybridSovereign Primary Operator Helm chart","namespace":"$(OCI_NAMESPACE)"}' \
	  "https://$(OCI_HOST)/api/v1/repository" > /dev/null 2>&1 \
	  && printf "  $(GREEN)✓$(RESET)  Repository created (or exists)\n" \
	  || printf "  $(GREEN)✓$(RESET)  Repository already exists\n"
	@echo "$(OCI_REGISTRY_TOKEN)" | helm registry login "$(OCI_HOST)" \
	  --username='$$oauthtoken' --password-stdin > /dev/null 2>&1
	$(call ok,Logged in to $(OCI_HOST))
	@helm package $(PRIMARY_OPERATOR_CHART_REPO)/helm -d /tmp/helm-pkg > /dev/null
	@CHART_VER=$$(grep '^version:' $(PRIMARY_OPERATOR_CHART_REPO)/helm/Chart.yaml | awk '{print $$2}'); \
	 helm push /tmp/helm-pkg/hybridsovereign-primary-operator-$${CHART_VER}.tgz oci://$(OCI_HOST)/$(OCI_NAMESPACE)
	$(call ok,hybridsovereign-primary-operator chart pushed)
