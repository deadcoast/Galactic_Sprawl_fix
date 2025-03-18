import { Position } from '../../types/core/GameTypes';

interface QuadTreeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QuadTreeObject {
  id: string;
  position: Position;
}

class QuadTreeNode {
  private bounds: QuadTreeBounds;
  private maxObjects: number;
  private objects: QuadTreeObject[];
  private nodes: QuadTreeNode[];
  private level: number;
  private maxLevels: number;

  constructor(bounds: QuadTreeBounds, level: number, maxLevels: number, maxObjects: number) {
    this.bounds = bounds;
    this.maxObjects = maxObjects;
    this.objects = [];
    this.nodes = [];
    this.level = level;
    this.maxLevels = maxLevels;
  }

  private split(): void {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const { x, y } = this.bounds;

    this.nodes[0] = new QuadTreeNode(
      { x: x + subWidth, y: y, width: subWidth, height: subHeight },
      this.level + 1,
      this.maxLevels,
      this.maxObjects
    );

    this.nodes[1] = new QuadTreeNode(
      { x: x, y: y, width: subWidth, height: subHeight },
      this.level + 1,
      this.maxLevels,
      this.maxObjects
    );

    this.nodes[2] = new QuadTreeNode(
      { x: x, y: y + subHeight, width: subWidth, height: subHeight },
      this.level + 1,
      this.maxLevels,
      this.maxObjects
    );

    this.nodes[3] = new QuadTreeNode(
      { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight },
      this.level + 1,
      this.maxLevels,
      this.maxObjects
    );
  }

  private getIndex(obj: QuadTreeObject): number {
    let index = -1;
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

    const topQuadrant = obj.position.y < horizontalMidpoint;
    const bottomQuadrant = obj.position.y > horizontalMidpoint;

    if (obj.position.x < verticalMidpoint) {
      if (topQuadrant) {
        index = 1;
      } else if (bottomQuadrant) {
        index = 2;
      }
    } else if (obj.position.x > verticalMidpoint) {
      if (topQuadrant) {
        index = 0;
      } else if (bottomQuadrant) {
        index = 3;
      }
    }

    return index;
  }

  insert(obj: QuadTreeObject): void {
    if (this.nodes.length > 0) {
      const index = this.getIndex(obj);
      if (index !== -1) {
        this.nodes[index].insert(obj);
        return;
      }
    }

    this.objects.push(obj);

    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }

      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i]);
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }

  retrieve(bounds: QuadTreeBounds): QuadTreeObject[] {
    const returnObjects: QuadTreeObject[] = [];
    const index = this.getIndex({
      id: 'temp',
      position: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    });

    if (this.nodes.length > 0) {
      if (index !== -1) {
        returnObjects.push(...this.nodes[index].retrieve(bounds));
      } else {
        // Object overlaps multiple quadrants
        for (const node of this.nodes) {
          returnObjects.push(...node.retrieve(bounds));
        }
      }
    }

    returnObjects.push(...this.objects);
    return returnObjects;
  }

  clear(): void {
    this.objects = [];
    for (const node of this.nodes) {
      if (node) {
        node.clear();
      }
    }
    this.nodes = [];
  }
}

export class QuadTree {
  private root: QuadTreeNode;

  constructor(bounds: QuadTreeBounds, maxObjects: number = 10, maxLevels: number = 5) {
    this.root = new QuadTreeNode(bounds, 0, maxLevels, maxObjects);
  }

  insert(obj: QuadTreeObject): void {
    this.root.insert(obj);
  }

  retrieve(bounds: QuadTreeBounds): QuadTreeObject[] {
    return this.root.retrieve(bounds);
  }

  clear(): void {
    this.root.clear();
  }
}
