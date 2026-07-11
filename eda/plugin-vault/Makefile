IMAGE_REGISTRY ?= quay.example.com
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-plugin-vault
DE_TAG ?= 0.1.0

.PHONY: de-plugin-vault-build-push de-plugin-vault-build de-plugin-vault-push

de-plugin-vault-build:
	ansible-builder build -f decision-environment.yml -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-vault-push:
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-vault-build-push: de-plugin-vault-build de-plugin-vault-push
