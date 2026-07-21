IMAGE_REGISTRY ?= $(OCI_HOST)
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-plugin-quay
DE_TAG ?= 0.1.0

.PHONY: de-plugin-quay-build-push de-plugin-quay-build de-plugin-quay-push

de-plugin-quay-build:
	ansible-builder create -f decision-environment.yml
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/openshift-clients/d'"'"' /tmp/src/bindep.txt' context/Containerfile
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/^systemd-python/d'"'"' /tmp/src/requirements.txt' context/Containerfile
	podman build -f context/Containerfile context/ -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-quay-push:
	podman tag registry.redhat.io/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG) $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG) 2>/dev/null || true
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-plugin-quay-build-push: de-plugin-quay-build de-plugin-quay-push
