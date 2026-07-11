IMAGE_REGISTRY ?= quay.example.com
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-plugin-aap
DE_TAG ?= 0.1.0

.PHONY: de-plugin-aap-build-push de-plugin-aap-build de-plugin-aap-push

de-plugin-aap-build:
	ansible-builder build -f decision-environment.yml -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-aap-push:
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-aap-build-push: de-plugin-aap-build de-plugin-aap-push
