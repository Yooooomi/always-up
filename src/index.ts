import { DockerOrchestrator } from "./orchestrator/docker.orchestrator";
import { Orchestrator } from "./orchestrator/orchestrator";

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function boot(orchestrator: Orchestrator) {
  await orchestrator.init();

  while (true) {
    const items = await orchestrator.getEnabledItems();
    for (const item of items) {
      const isHealthy = await orchestrator.checkHealth(item);
      if (isHealthy) {
        continue;
      }
      console.log(`[Manager]: ${item.id} is not healthy, restarting`);
      await orchestrator.handleRestartAndDependencies(item);
    }
    await wait(60 * 1000);
  }
}

boot(new DockerOrchestrator());
