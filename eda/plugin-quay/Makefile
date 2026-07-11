IMAGE_REGISTRY ?= quay.example.com
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-plugin-quay
DE_TAG ?= 0.1.0

.PHONY: de-plugin-quay-build-push de-plugin-quay-build de-plugin-quay-push

de-plugin-quay-build:
	ansible-builder build -f decision-environment.yml -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-quay-push:
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-quay-build-push: de-plugin-quay-build de-plugin-quay-push
