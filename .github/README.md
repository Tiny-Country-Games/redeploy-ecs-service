# Redeploy ECS Service

This action will force a enw deployment of the latest task definition for a given ECS service on AWS. It will also wait
for the deployment to complete and the service to enter a stable state.

You must use the `aws-actions/configure-aws-credentials` action before this action to configure your AWS credentials.

```yaml
- uses: aws-actions/configure-aws-credentials@vX
  with: { ... }
- uses: Tiny-Country-Games/redeploy-ecs-service@v1
  with:
    cluster: service-cluster
    service: service-name
    max-wait-minutes: 10
```

The `max-wait-minutes` parameter is optional and defaults to 10 minutes. If provided, it must be a positive number.
