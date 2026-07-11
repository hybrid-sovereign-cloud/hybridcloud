IMAGE_REGISTRY ?= quay.example.com
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-project
DE_TAG ?= 0.1.0

.PHONY: de-project-build-push de-project-build de-project-push

de-project-build:
	ansible-builder build -f decision-environment.yml -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-project-push:
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-project-build-push: de-project-build de-project-push
