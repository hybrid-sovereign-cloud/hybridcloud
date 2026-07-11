IMAGE_REGISTRY ?= quay.example.com
IMAGE_NAMESPACE ?= hybrid-sovereign
IMAGE_NAME = event-forwarder
IMAGE_TAG ?= 0.1.0

.PHONY: event-forwarder-build event-forwarder-push event-forwarder-build-push

event-forwarder-build:
	podman build -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(IMAGE_NAME):$(IMAGE_TAG) -f Containerfile .

event-forwarder-push:
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(IMAGE_NAME):$(IMAGE_TAG)

event-forwarder-build-push: event-forwarder-build event-forwarder-push
