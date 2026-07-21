IMAGE_REGISTRY ?= $(OCI_HOST)
IMAGE_NAMESPACE ?= hybrid-sovereign
DE_NAME = de-openstack-migration
DE_TAG ?= 0.1.0

.PHONY: de-openstack-migration-build-push de-openstack-migration-build de-openstack-migration-push

de-openstack-migration-build:
	ansible-builder create -f decision-environment.yml
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/openshift-clients/d'"'"' /tmp/src/bindep.txt' context/Containerfile
	sed -i '/^RUN \/output\/scripts\/assemble/i RUN sed -i '"'"'/^systemd-python/d'"'"' /tmp/src/requirements.txt' context/Containerfile
	podman build -f context/Containerfile context/ -t $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-openstack-migration-push:
	podman push $(IMAGE_REGISTRY)/$(IMAGE_NAMESPACE)/$(DE_NAME):$(DE_TAG)

de-openstack-migration-build-push: de-openstack-migration-build de-openstack-migration-push
