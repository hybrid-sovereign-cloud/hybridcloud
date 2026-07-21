IMAGE_REGISTRY ?= $(OCI_HOST)
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-cloudaws
DE_TAG ?= 0.1.5

.PHONY: de-cloudaws-build-push de-cloudaws-build de-cloudaws-push

de-cloudaws-build:
	ansible-builder create -f decision-environment.yml
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/openshift-clients/d'"'"' /tmp/src/bindep.txt' context/Containerfile
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/^systemd-python/d'"'"' /tmp/src/requirements.txt' context/Containerfile
	podman build -f context/Containerfile context/ -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-cloudaws-push:
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-cloudaws-build-push: de-cloudaws-build de-cloudaws-push
