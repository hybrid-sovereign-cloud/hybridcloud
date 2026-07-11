IMAGE_REGISTRY ?= quay.example.com
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-platformopenshift
DE_TAG ?= 0.1.7

.PHONY: de-platformopenshift-build-push de-platformopenshift-build de-platformopenshift-push

de-platformopenshift-build:
	ansible-builder create -f decision-environment.yml
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/openshift-clients/d'"'"' /tmp/src/bindep.txt' context/Containerfile
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/^systemd-python/d'"'"' /tmp/src/requirements.txt' context/Containerfile
	podman build -f context/Containerfile context/ -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-platformopenshift-push:
	podman tag $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG) quay.example.com/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG) 2>/dev/null || true
	podman push quay.example.com/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-platformopenshift-build-push: de-platformopenshift-build de-platformopenshift-push
