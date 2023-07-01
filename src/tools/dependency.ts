import { Item } from "../item/item";

type Graph = Record<string, string[]>;

class UnknownReference extends Error {
  constructor(id: string) {
    super(`Referencing unknown id ${id}`);
  }
}

class CircularDependency extends Error {
  constructor(id: string) {
    super(`Detected circular dependency when analyzing ${id}`);
  }
}

export class Dependency {
  static checkValidDependencies(graph: Graph) {
    const allIds = new Set(Object.keys(graph));
    const visited = new Set<string>();

    function dfs(node: string): boolean {
      if (!allIds.has(node)) {
        throw new UnknownReference(node);
      }

      if (visited.has(node)) {
        return true; // Circular dependency found
      }

      visited.add(node);

      const dependencies = graph[node] || [];
      for (let i = 0; i < dependencies.length; i++) {
        if (dfs(dependencies[i]!)) {
          return true; // Circular dependency found
        }
      }

      visited.delete(node);
      return false;
    }

    for (const node of Object.keys(graph)) {
      if (dfs(node)) {
        throw new CircularDependency(node);
      }
    }
  }

  static getDependencyLayers(item: Item) {
    let items = [item];
    let nextItems: Item[] = [];
    let depth = 0;
    const layers: Item[][] = [];

    while (items.length > 0) {
      const item = items.shift();
      const layer = layers[depth] ?? [];
      layers[depth] = layer;
      if (!item) {
        continue;
      }
      layer.push(item);
      nextItems.push(...item.dependencies);
      if (items.length === 0) {
        items = nextItems;
        nextItems = [];
        depth += 1;
      }
    }
    return layers;
  }
}
