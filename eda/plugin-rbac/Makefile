IMAGE_REGISTRY ?= quay.example.com
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-plugin-rbac
DE_TAG ?= 0.1.0

.PHONY: de-plugin-rbac-build-push de-plugin-rbac-build de-plugin-rbac-push

de-plugin-rbac-build:
	ansible-builder build -f decision-environment.yml -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-rbac-push:
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-rbac-build-push: de-plugin-rbac-build de-plugin-rbac-push
