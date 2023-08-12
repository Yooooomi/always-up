import { DockerOrchestrator } from "./orchestrator/docker.orchestrator";
import { Orchestrator } from "./orchestrator/orchestrator";
import { Environment } from "./tools/env";
import { ProcessEnvironment } from "./tools/process.env";

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function boot(orchestrator: Orchestrator, environment: Environment) {
  await orchestrator.init();

  const interval = environment.getInterval();
  console.log(`[Manager]: Looping every ${interval} seconds`);

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
    await wait(interval * 1000);
  }
}

const env = new ProcessEnvironment();
boot(new DockerOrchestrator(env), env);
