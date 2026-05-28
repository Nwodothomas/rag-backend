# RAG Backend System Design Architecture

This document defines the recommended system design and execution plan for `rag-backend`, with the work split into modular phases so implementation can be delivered incrementally and safely.

It covers:

- development workflow architecture
- deployment and CI/CD workflow architecture
- AWS runtime architecture
- EC2 setup steps as a managed fallback path
- phased execution plan

## 1. Purpose

`rag-backend` is the backend API gateway and ETL orchestration layer for the RAG platform.

It sits between:

- the developer ETL dashboard deployed on Vercel
- Supabase Storage and database services
- OpenAI embedding and answer-generation services
- background ingestion jobs
- end-user query consumers

The backend must support:

- persistent API availability
- secure document ingestion
- async processing for large files
- operational observability
- controlled deployment promotion from development to production

## 2. System Overview

### 2.1 Core Backend Responsibilities

- accept uploads from the developer dashboard
- register URLs for ingestion
- store raw assets in Supabase Storage
- trigger extraction, transformation, embedding, and indexing workflows
- expose query endpoints for RAG retrieval
- provide admin tools for monitoring, re-ingestion, and stats
- run background jobs for long-running ETL work

### 2.2 Recommended Runtime Pattern

The recommended production pattern is:

- frontend developer dashboard on Vercel
- backend API on AWS ECS
- background worker on AWS ECS
- optional scheduler on AWS ECS or EventBridge
- container images stored in Amazon ECR
- logs and alarms in CloudWatch
- secrets in AWS Secrets Manager or SSM Parameter Store

### 2.3 Why ECS Is Recommended Over Pure EC2

ECS is recommended because the backend has two distinct workloads:

- an always-on HTTP API
- background ETL processing jobs

ECS gives cleaner service separation, easier deployments, better restart behavior, easier scaling, and less server maintenance overhead than self-managed EC2.

EC2 remains a valid fallback if:

- you want lower initial platform complexity
- you prefer full server control
- traffic is still small and operational burden is acceptable

## 3. High-Level Architecture

### 3.1 Logical Components

1. Developer Dashboard
   - internal admin UI
   - uploads files and URLs
   - views ingestion logs and system status

2. RAG Backend API
   - validates and receives uploads
   - exposes `/upload`, `/ingest`, `/query`, `/health`, and admin endpoints
   - forwards storage and indexing work to backend services

3. Ingestion Worker
   - processes long-running extraction and embedding tasks
   - handles retries and failure reporting

4. Scheduler
   - runs periodic cleanup or re-ingestion jobs

5. Supabase
   - object storage for uploaded source files
   - Postgres tables for file metadata and ingestion records
   - vector-enabled storage layer for chunk embeddings if used there

6. OpenAI
   - embeddings
   - answer-generation for query workflows

7. Observability Layer
   - structured application logs
   - ingestion metrics
   - alerts for failures and service health

### 3.2 Request and Processing Flow

#### Upload and Ingestion Flow

1. Developer uploads a file or submits a URL from the ETL dashboard.
2. Backend authenticates the developer request.
3. Backend stores the raw file in Supabase Storage.
4. Backend creates a metadata record for the uploaded source.
5. Backend marks the asset as queued for ingestion.
6. Worker picks up the ingestion job.
7. Worker extracts text from the file or URL.
8. Worker chunks the text.
9. Worker generates embeddings.
10. Worker loads chunk records and embeddings into the knowledge base store.
11. Worker updates ingestion status and logs.

#### Query Flow

1. Client submits a question to `/query`.
2. Backend authenticates or rate-limits the request as required.
3. Backend embeds the query.
4. Backend retrieves similar chunks from the vector store.
5. Backend composes context.
6. Backend calls the answer-generation model.
7. Backend returns the answer plus match metadata.

## 4. Development Workflow Architecture

This section defines how backend development should be executed in a controlled and modular way.

### Phase 1. Foundation and Environment Definition

Goal:
- establish project conventions and environment boundaries

Work:
- define local, staging, and production environments
- define required secrets and configuration keys
- confirm backend route responsibilities
- define process types: API, worker, scheduler
- define logging and health-check standards
- document expected deployment inputs and outputs

Deliverables:
- environment variable matrix
- agreed route map
- agreed service boundaries
- documented runtime responsibilities

Exit criteria:
- team agrees what belongs in API vs worker vs scheduler
- all required external integrations are listed

### Phase 2. Local Development Workflow

Goal:
- ensure every developer can run and validate the backend locally

Work:
- run the API process locally
- run the worker process locally
- test upload, ingestion trigger, and query flows
- validate Supabase connectivity
- validate OpenAI connectivity
- confirm local logs are structured and readable

Deliverables:
- local setup guide
- working `.env` template
- local smoke test checklist

Exit criteria:
- a developer can execute the full upload-to-query flow locally

### Phase 3. Backend Module Delivery

Goal:
- deliver the system in isolated functional slices

Recommended slice order:

1. health and config
2. auth and admin access control
3. upload routes
4. ingestion trigger routes
5. storage integration
6. file extraction pipeline
7. chunking and embedding
8. query retrieval flow
9. admin monitoring routes
10. cleanup and scheduled jobs

Deliverables:
- feature-complete backend modules shipped in small increments

Exit criteria:
- each slice is tested before the next slice is expanded

### Phase 4. Integration and Staging Validation

Goal:
- validate the backend with the deployed developer dashboard

Work:
- connect the Vercel ETL dashboard to staging backend endpoints
- validate upload types individually
- validate ingestion status visibility
- validate query behavior using staged knowledge-base data
- validate logs, errors, and retry behavior

Deliverables:
- staging validation checklist
- defect log and fix cycle

Exit criteria:
- dashboard and backend work together end to end in staging

## 5. CI/CD Workflow Architecture

This section defines how code moves from local development into staging and production.

### 5.1 Branching and Promotion Model

Recommended flow:

1. developer creates feature branch
2. work is reviewed through pull request
3. CI validates branch
4. merge to `main`
5. deploy automatically to staging
6. run staging validation
7. approve production release
8. promote the same image to production

### 5.2 Pipeline Stages

#### Stage A. Source Validation

Checks:
- install dependencies
- validate environment assumptions
- lint if enabled
- run tests
- build application

Purpose:
- fail fast before containerization or deployment

#### Stage B. Container Build

Checks:
- build Docker image
- validate startup command
- validate runtime artifact exists

Purpose:
- ensure the release unit is reproducible and deployable

#### Stage C. Artifact Publishing

Checks:
- tag image with commit SHA
- optionally tag image with release version
- push image to Amazon ECR

Purpose:
- create immutable deployable artifacts

#### Stage D. Staging Deployment

Checks:
- deploy API service to ECS staging
- deploy worker service to ECS staging
- refresh task definitions if required
- validate health endpoint

Purpose:
- test the release in a production-like environment

#### Stage E. Staging Smoke Tests

Checks:
- API health endpoint
- upload route accessibility
- ingestion trigger behavior
- query endpoint response
- worker connectivity to storage and model providers

Purpose:
- catch deployment and environment defects before production

#### Stage F. Production Approval

Checks:
- manual review of staging result
- release signoff

Purpose:
- avoid automatic promotion of a broken backend

#### Stage G. Production Deployment

Checks:
- deploy the exact same approved container image to production ECS
- validate health and logs immediately after rollout

Purpose:
- keep production releases consistent and auditable

### 5.3 Rollback Strategy

Rollback should be planned before first production deployment.

Recommended rollback methods:

- redeploy previous stable container image
- revert ECS task definition revision
- scale down faulty worker revision
- temporarily disable scheduler if it is causing ingestion failures

Rollback triggers:

- health endpoint failing after deployment
- major 5xx increase
- worker crash loops
- ingestion queue backlog spikes
- broken dashboard-to-backend integration

## 6. AWS Runtime Architecture

### 6.1 Recommended AWS Services

- Amazon ECR for container image storage
- Amazon ECS for application runtime
- Application Load Balancer for API routing
- CloudWatch for logs, alarms, and dashboards
- Secrets Manager or SSM Parameter Store for secret management
- IAM roles for task access control
- EventBridge for scheduled jobs if preferred over an always-on scheduler

### 6.2 ECS Service Design

#### API Service

Purpose:
- serves public and internal HTTP routes

Characteristics:
- persistent
- load-balanced
- horizontally scalable
- health-checked

Endpoints served:
- `/health`
- `/upload/*`
- `/ingest/:fileId`
- `/query`
- `/admin/*`

#### Worker Service

Purpose:
- runs ingestion jobs asynchronously

Characteristics:
- not exposed publicly
- restartable independently of the API
- scalable based on ingestion demand

#### Scheduler Service or EventBridge Trigger

Purpose:
- periodic re-ingestion
- periodic cleanup
- metadata refresh or housekeeping

Characteristics:
- lightweight
- independent of user traffic

### 6.3 Environment Separation

Maintain separate AWS resources for:

- staging
- production

At minimum, separate:

- ECS services
- task definitions
- secrets
- log groups
- buckets if applicable
- database or schema namespaces if needed

## 7. EC2 Setup Architecture

This section documents EC2 as a recommended fallback path when ECS is not yet adopted.

### 7.1 When To Use EC2

Use EC2 if:

- you need the fastest path to a single-host deployment
- you are comfortable managing operating system updates
- expected traffic is modest
- you can tolerate more manual operational work

### 7.2 EC2 Runtime Pattern

Recommended instance layout:

- one VM for API and worker on small deployments
- or separate VMs for API and worker if ingestion load is heavy

Core host responsibilities:

- run Docker
- pull images from ECR
- inject secrets securely
- restart containers after failure
- publish logs to CloudWatch

### 7.3 EC2 Setup Phases

#### EC2 Phase 1. Provision Instance

Work:
- choose Ubuntu LTS AMI
- choose instance size based on API and worker load
- configure VPC and subnet
- assign security groups
- attach IAM role for ECR, CloudWatch, and secret access

Exit criteria:
- instance is reachable and attached to the correct network and IAM role

#### EC2 Phase 2. Secure Host Access

Work:
- allow SSH only from trusted IPs
- allow HTTP and HTTPS as required
- reduce open ports to the minimum needed
- configure key management policy

Exit criteria:
- instance is reachable only through approved access paths

#### EC2 Phase 3. Install Runtime Dependencies

Work:
- install Docker
- install optional Docker Compose
- install CloudWatch agent
- confirm system time, disk, and memory are healthy

Exit criteria:
- host can run containers and emit logs

#### EC2 Phase 4. Deploy Containers

Work:
- authenticate instance to ECR
- pull backend image
- run API container
- run worker container
- optionally run scheduler container

Exit criteria:
- containers start successfully and remain healthy

#### EC2 Phase 5. Networking and Traffic Routing

Work:
- route domain or load balancer traffic to the API container
- expose only the API publicly
- keep worker private
- validate `/health`

Exit criteria:
- external requests reach the API reliably

#### EC2 Phase 6. Operations and Maintenance

Work:
- configure restarts on failure
- configure deployment update procedure
- configure backup and rollback procedure
- configure log retention and alarms

Exit criteria:
- backend can be updated and recovered safely

## 8. Modular Execution Plan

This is the recommended implementation order for the whole backend program.

### Module 1. Architecture and Environment Planning

Includes:
- service boundaries
- route ownership
- env variable inventory
- staging and production split

Outcome:
- team alignment before infrastructure or app rollout

### Module 2. Local Development Workflow

Includes:
- local run process
- local secrets and mocks
- smoke tests
- dashboard-to-local-backend integration

Outcome:
- stable daily developer experience

### Module 3. Containerization and Runtime Readiness

Includes:
- Docker verification
- startup behavior
- health-check behavior
- API and worker runtime separation

Outcome:
- backend is deployable as a repeatable artifact

### Module 4. CI Validation Pipeline

Includes:
- dependency installation
- build validation
- tests
- artifact generation

Outcome:
- every merge is quality-checked

### Module 5. AWS Staging Deployment

Includes:
- ECR
- ECS or EC2 staging host
- secrets setup
- CloudWatch logs
- dashboard integration verification

Outcome:
- safe test environment for real integrations

### Module 6. Production Deployment Pipeline

Includes:
- release approval
- production rollout
- post-deploy validation
- rollback readiness

Outcome:
- reliable production delivery

### Module 7. Post-Deployment Operations

Includes:
- monitoring
- alerting
- ingestion retry policies
- cleanup and re-ingestion schedules

Outcome:
- stable long-term backend operations

## 9. Recommended Execution Sequence

Follow this order:

1. approve the architecture and environment boundaries
2. finalize local development workflow
3. validate API and worker separation
4. finalize container runtime behavior
5. build CI validation pipeline
6. deploy staging environment
7. validate with the Vercel ETL dashboard
8. add production promotion controls
9. deploy production
10. enable monitoring, alerting, and rollback operations

## 10. Decision Summary

### Primary Recommendation

Use:

- Vercel for the developer dashboard
- AWS ECS for `rag-backend` API and worker runtime
- Amazon ECR for container registry
- CloudWatch for observability
- Secrets Manager or SSM for secret management

### Secondary Recommendation

Use EC2 only as:

- a temporary bootstrap deployment path
- a fallback for teams not ready for ECS orchestration yet

### Operational Principle

Ship in phases.

Do not combine:

- app architecture finalization
- infrastructure rollout
- CI/CD rollout
- production go-live

into a single execution batch. Each should be completed and validated as its own module before moving to the next phase.
