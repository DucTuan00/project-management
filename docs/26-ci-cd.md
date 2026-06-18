# CI/CD Pipeline

## Purpose
Define the GitHub Actions CI/CD pipeline including workflows for testing, building, and deploying the platform across environments.

## Pipeline Overview

```
Push/PR to main
    |
    v
[CI Pipeline]
    - Lint
    - Type Check
    - Unit Tests
    - Integration Tests
    - Build
    - Security Scan
    |
    v
[CD Pipeline - Staging]
    - Deploy to staging
    - Run smoke tests
    - Run E2E tests
    |
    v
[Manual Approval Gate]
    |
    v
[CD Pipeline - Production]
    - Deploy to production
    - Health check verification
```

## Branch Strategy

| Branch | CI Trigger | CD Trigger | Environment |
|--------|------------|------------|-------------|
| feature/* | Lint + Test | None | Local |
| develop | Full CI | Deploy staging | Staging |
| main | Full CI | Manual approval -> Deploy | Production |
| hotfix/* | Full CI | Urgent deploy | Production |

## GitHub Actions Workflows

### CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Lint
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

      - name: Type check
        run: |
          cd backend && npx tsc --noEmit
          cd ../frontend && npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: pmplatform_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Unit tests
        run: cd backend && npm run test:unit -- --reporter=junit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/pmplatform_test
          REDIS_URL: redis://localhost:6379

      - name: Integration tests
        run: cd backend && npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/pmplatform_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: davelosert/vitest-coverage-report-action@v2
        if: always()
        with:
          json-summary-path: ./backend/coverage/coverage-summary.json

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - name: Build backend
        run: |
          cd backend
          npm ci
          npm run build

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ vars.STAGING_API_URL }}
          NEXT_PUBLIC_SOCKET_URL: ${{ vars.STAGING_SOCKET_URL }}

      - name: Build Docker images
        run: |
          docker compose -f docker-compose.yml build

      - name: Save images
        run: |
          docker save pmplatform-backend:latest -o backend.tar
          docker save pmplatform-frontend:latest -o frontend.tar

      - uses: actions/upload-artifact@v4
        with:
          name: docker-images
          path: |
            backend.tar
            frontend.tar

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: |
          cd backend && npm audit --audit-level=high
          cd ../frontend && npm audit --audit-level=high

      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
```

### CD Workflow (Staging)

```yaml
# .github/workflows/cd-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY_BACKEND: pmplatform/backend
          ECR_REPOSITORY_FRONTEND: pmplatform/frontend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker compose -f docker-compose.yml build
          docker tag pmplatform-backend:latest $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG
          docker tag pmplatform-frontend:latest $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG

      - name: Deploy to staging
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/pmplatform
            docker compose pull
            docker compose up -d
            docker system prune -f

      - name: Run smoke tests
        run: |
          sleep 10
          curl -f http://${{ secrets.STAGING_HOST }}/health || exit 1
          curl -f http://${{ secrets.STAGING_HOST }}/api/v1/auth/health || exit 1
```

### CD Workflow (Production)

```yaml
# .github/workflows/cd-production.yml
name: Deploy to Production
on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "deploy" to confirm production deployment'
        required: true

jobs:
  deploy-production:
    if: github.event.inputs.confirm == 'deploy'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker compose -f docker-compose.prod.yml build
          docker tag pmplatform-backend:latest $ECR_REGISTRY/pmplatform/backend:$IMAGE_TAG
          docker tag pmplatform-backend:latest $ECR_REGISTRY/pmplatform/backend:latest
          docker tag pmplatform-frontend:latest $ECR_REGISTRY/pmplatform/frontend:$IMAGE_TAG
          docker tag pmplatform-frontend:latest $ECR_REGISTRY/pmplatform/frontend:latest
          docker push --all-tags $ECR_REGISTRY/pmplatform/backend
          docker push --all-tags $ECR_REGISTRY/pmplatform/frontend

      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/pmplatform
            docker compose pull
            docker compose up -d --wait
            docker system prune -f

      - name: Verify deployment
        run: |
          for i in 1 2 3 4 5; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://pmplatform.com/health)
            if [ "$STATUS" = "200" ]; then
              echo "Deployment verified successfully"
              exit 0
            fi
            echo "Attempt $i: Health check returned $STATUS, waiting..."
            sleep 10
          done
          echo "Deployment verification failed"
          exit 1

      - name: Notify team
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "Production deployment complete! Version: ${{ github.sha }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment Complete* :rocket:\nVersion: `${{ github.sha }}`\nDeployed by: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Environment Variables in CI

| Variable | CI Secret | Used In |
|----------|-----------|---------|
| DATABASE_URL | No (test DB) | CI tests |
| REDIS_URL | No (test Redis) | CI tests |
| JWT_ACCESS_SECRET | Yes | Build tests |
| JWT_REFRESH_SECRET | Yes | Build tests |
| STAGING_HOST | Yes | CD staging |
| STAGING_SSH_KEY | Yes | CD staging |
| PROD_HOST | Yes | CD production |
| PROD_SSH_KEY | Yes | CD production |
| AWS_ACCESS_KEY_ID | Yes | All CD |
| AWS_SECRET_ACCESS_KEY | Yes | All CD |
| SLACK_WEBHOOK_URL | Yes | CD production |

## Quality Gates

| Gate | Check | Action on Failure |
|------|-------|------------------|
| G1 | Lint passes | Block PR merge |
| G2 | TypeScript compiles | Block PR merge |
| G3 | Unit tests pass | Block PR merge |
| G4 | Integration tests pass | Block PR merge |
| G5 | Coverage >= 80% | Block PR merge |
| G6 | npm audit (no high/CVEs) | Block PR merge |
| G7 | Trivy scan (no critical) | Block PR merge |
| G8 | Docker build succeeds | Block PR merge |
| G9 | Staging smoke tests pass | Block production deploy |
| G10 | Manual approval | Required for production |

## Design Decisions

- **Pull-based deployment over push-based** - The server pulls the latest Docker image rather than GitHub Actions pushing it. This avoids opening SSH port in production firewalls.
- **Workflow_dispatch for production** - Manual trigger with confirmation prevents accidental deployments. The deployer must type "deploy" to confirm.
- **Separate staging and production workflows** - Different environments have different credentials, configurations, and approval flows.
- **Service containers for tests** - Integration tests run against real PostgreSQL/Redis started as GitHub Actions service containers, not mocked or in-memory substitutes.
- **ECR over Docker Hub** - ECR integrates with AWS IAM for fine-grained access control and does not require a separate Docker Hub account.

## Future Considerations

- **Deployment previews** - Every PR deploys to a temporary preview environment with its own URL. Teardown on PR close.
- **Canary deployments** - Route 5% of traffic to new version. Monitor error rates before routing 100%.
- **Feature flags** - LaunchDarkly or custom flag system for gradual feature rollout independent of deployment.
- **Database migration automation** - Run migrations as a separate step before deploying new backend containers. Rollback migrations if deploy fails.
- **Scheduled database backups** - Automated backup job as part of CI/CD pipeline, not manual cron on the server.
