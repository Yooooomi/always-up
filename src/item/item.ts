export class Item {
  constructor(public readonly id: string, public dependencies: Item[] = []) {}

  addDependency(item: Item) {
    this.dependencies.push(item);
  }
}
