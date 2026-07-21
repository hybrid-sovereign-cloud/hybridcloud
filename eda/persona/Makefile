IMAGE_REGISTRY ?= $(OCI_HOST)
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-persona
DE_TAG ?= 0.1.0

.PHONY: de-persona-build-push de-persona-build de-persona-push

de-persona-build:
	ansible-builder create -f decision-environment.yml
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/openshift-clients/d'"'"' /tmp/src/bindep.txt' context/Containerfile
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/^systemd-python/d'"'"' /tmp/src/requirements.txt' context/Containerfile
	podman build -f context/Containerfile context/ -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-persona-push:
	podman tag registry.redhat.io/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG) $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG) 2>/dev/null || true
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-persona-build-push: de-persona-build de-persona-push
