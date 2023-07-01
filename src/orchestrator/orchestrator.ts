import { Item } from "../item/item";

export abstract class Orchestrator {
  protected static NotInited = class extends Error {
    constructor(name: string) {
      super(`${name} has not been inited`);
    }
  };

  async init() {}

  log(...logs: any[]) {
    console.log(`[${this.constructor.name}]:`, ...logs);
  }

  abstract getEnabledItems(): Promise<Item[]>;
  abstract checkHealth(item: Item): Promise<boolean>;
  abstract handleRestartAndDependencies(item: Item): Promise<void>;
}
