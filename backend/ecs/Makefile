.PHONY: help login create-repo build tag push all clean

IMAGE_NAME = inventory-api
AWS_ACCOUNT_ID = 186019336293
AWS_REGION = us-east-1
ECR_REPO = $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(IMAGE_NAME)
TAG ?= latest

help:
	@echo "Available targets:"
	@echo "  make build        - Build Docker image"
	@echo "  make push         - Push image to ECR (includes login + tag)"
	@echo "  make all          - Build and push"
	@echo "  make create-repo  - Create ECR repository"
	@echo "  make clean        - Remove local Docker images"

login:
	@echo "Logging into ECR..."
	@aws ecr get-login-password --region $(AWS_REGION) | \
	docker login --username AWS --password-stdin $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com

create-repo:
	@echo "Creating ECR repository..."
	@aws ecr create-repository \
		--repository-name $(IMAGE_NAME) \
		--region $(AWS_REGION) 2>/dev/null || echo "Repository already exists or creation failed"

build:
	@echo "Building Docker image..."
	docker build -t $(IMAGE_NAME):$(TAG) .
	@echo "✅ Image built: $(IMAGE_NAME):$(TAG)"

tag:
	@echo "Tagging image..."
	docker tag $(IMAGE_NAME):$(TAG) $(ECR_REPO):$(TAG)

push: login tag
	@echo "Pushing image to ECR..."
	docker push $(ECR_REPO):$(TAG)
	@echo "Image pushed: $(ECR_REPO):$(TAG)"

all: build push

clean:
	@echo "Removing local images..."
	@docker rmi $(IMAGE_NAME):$(TAG) 2>/dev/null || echo "Local image not found"
	@docker rmi $(ECR_REPO):$(TAG) 2>/dev/null || echo "ECR tagged image not found"
	@echo "Cleanup complete"
