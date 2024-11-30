import * as core from '@actions/core';
import { ECS, waitUntilServicesStable, UpdateServiceCommand, DescribeServicesCommand } from '@aws-sdk/client-ecs';

const CLUSTER_NAME = core.getInput('cluster', { required: true, trimWhitespace: true });
const SERVICE_NAME = core.getInput('service', { required: true, trimWhitespace: true });
let ecs: ECS;

let done: boolean = false;

const describeEvents = async (preDeployTime: Date) => {
  const temp = await ecs.send(
    new DescribeServicesCommand({
      cluster: CLUSTER_NAME,
      services: [SERVICE_NAME],
    })
  );
  const services = temp.services ?? [];
  if (services.length === 0) return [];
  const [service] = services;
  return (service.events ?? []).filter((event) => (event.createdAt ?? new Date(0)) > preDeployTime);
};

const logEvents = async (preDeployTime: Date) => {
  const seenEvents = new Set<string>();
  while (!done) {
    const events = (await describeEvents(preDeployTime)).filter((event) => !seenEvents.has(event.id ?? ''));
    for (const event of events) {
      console.log(`${event.createdAt}: ${event.message}`);
      seenEvents.add(event.id ?? '');
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

(async () => {
  try {
    ecs = new ECS();
    console.log(`${new Date()} Force new deployment for service ${SERVICE_NAME} in cluster ${CLUSTER_NAME}`);
    const preDeployTime = new Date();
    await ecs.send(
      new UpdateServiceCommand({
        cluster: CLUSTER_NAME,
        service: SERVICE_NAME,
        forceNewDeployment: true,
      })
    );
    const waiter = waitUntilServicesStable(
      { client: ecs, maxWaitTime: 100000 },
      { cluster: CLUSTER_NAME, services: [SERVICE_NAME] }
    );
    const eventLogger = logEvents(preDeployTime);
    await waiter;
    done = true;
    await eventLogger;
  } catch (e) {
    core.setFailed((e as Error).message);
  }
})();
