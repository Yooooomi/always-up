import { Item } from "../item/item";
import { Dependency } from "../tools/dependency";
import { Orchestrator } from "./orchestrator";
import Docker from "dockerode";

export class DockerOrchestrator extends Orchestrator {
  private instance: Docker | undefined;

  async init() {
    this.instance = new Docker({ socketPath: "/var/run/docker.sock" });
    await this.instance.info();
  }

  isContainerEnabled(labels: Record<string, string>) {
    return labels["always-up.enabled"] === "true";
  }

  getContainerDependencies(labels: Record<string, string>) {
    return labels["always-up.depends_on"]?.split(",").map((e) => `/${e}`) ?? [];
  }

  async getEnabledItems() {
    if (!this.instance) {
      throw new Orchestrator.NotInited(this.constructor.name);
    }

    const containers = await this.instance.listContainers();
    const dependencies: Record<string, string[]> = {};

    for (const container of containers) {
      const containerId = container.Names[0];
      if (!containerId || !this.isContainerEnabled(container.Labels)) {
        continue;
      }
      const containerDependencies = this.getContainerDependencies(
        container.Labels
      );
      dependencies[containerId] = containerDependencies;
    }
    Dependency.checkValidDependencies(dependencies);

    const items = Object.keys(dependencies).reduce<Record<string, Item>>(
      (acc, id) => {
        acc[id] = new Item(id);
        return acc;
      },
      {}
    );
    Object.entries(dependencies).forEach(([id, dependencies]) => {
      for (const dependency of dependencies) {
        const item = items[id];
        const dependsOn = items[dependency];
        if (!item || !dependsOn) {
          continue;
        }
        dependsOn.addDependency(item);
      }
    });

    return Object.values(items);
  }

  private async getContainerByName(name: string) {
    if (!this.instance) {
      throw new Orchestrator.NotInited(this.constructor.name);
    }

    const infos = (await this.instance.listContainers({ all: true })).find(
      (c) => c.Names.includes(name)
    );
    if (!infos) {
      return undefined;
    }
    return await this.instance.getContainer(infos.Id);
  }

  async checkHealth(item: Item) {
    const container = await this.getContainerByName(item.id);
    const infos = await container?.inspect();
    if (!infos?.State.Health) {
      this.log(`[WARN]: ${item.id} has no health check`);
      return true;
    }
    return infos?.State.Health?.Status !== "unhealthy";
  }

  async handleRestartAndDependencies(item: Item) {
    if (!this.instance) {
      throw new Orchestrator.NotInited(this.constructor.name);
    }

    const layers = Dependency.getDependencyLayers(item);
    const reversedLayers = [...layers].reverse();

    // Shutdown the leaves first
    for (const layer of reversedLayers) {
      for (const item of layer) {
        const container = await this.getContainerByName(item.id);
        if (!container) {
          continue;
        }
        this.log(`Stopping container ${item.id}`);
        await container.stop({ t: 1 });
      }
    }

    // Start the containers again from top
    for (const layer of layers) {
      for (const item of layer) {
        const container = await this.getContainerByName(item.id);
        if (!container) {
          continue;
        }
        this.log(`Starting container ${item.id}`);
        await container.start();
      }
    }
  }
}
