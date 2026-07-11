##@ Build Artifacts

.PHONY: upload-amq-streams-chart
upload-amq-streams-chart: check-env ## Package and push amq-streams Helm chart to OCI registry
	@echo "$(BOLD)Ensuring Quay repository for amq-streams chart...$(RESET)"
	@curl -sf -X POST \
	  -H "Authorization: Bearer $(OCI_REGISTRY_TOKEN)" \
	  -H "Content-Type: application/json" \
	  -d '{"repository":"amq-streams","visibility":"private","description":"AMQ Streams Kafka Helm chart","namespace":"$(OCI_NAMESPACE)"}' \
	  "https://$(OCI_HOST)/api/v1/repository" > /dev/null 2>&1 \
	  && printf "  $(GREEN)✓$(RESET)  Repository created (or exists)\n" \
	  || printf "  $(GREEN)✓$(RESET)  Repository already exists\n"
	@echo "$(OCI_REGISTRY_TOKEN)" | helm registry login "$(OCI_HOST)" \
	  --username='$$oauthtoken' --password-stdin > /dev/null 2>&1
	$(call ok,Logged in to $(OCI_HOST))
	@helm package helm/charts/amq-streams -d /tmp/helm-pkg > /dev/null
	@CHART_VER=$$(grep '^version:' helm/charts/amq-streams/Chart.yaml | awk '{print $$2}'); \
	 helm push /tmp/helm-pkg/amq-streams-$${CHART_VER}.tgz oci://$(OCI_HOST)/$(OCI_NAMESPACE)
	$(call ok,amq-streams chart pushed to oci://$(OCI_HOST)/$(OCI_NAMESPACE)/amq-streams)
