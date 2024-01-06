import { LinkedList } from './linked-list';

export class Queue {
  #list = new LinkedList();
  get length() {
    return this.#list.length;
  }

  constructor(items) {
    this.#list = new LinkedList();
    if (Array.isArray(items)) {
      items.forEach((item) => this.push(item));
    }
  }

  push(value) {
    this.#list.pushTail(value);
  }
  pop() {
    const node = this.#list.popHead();
    if (node !== null) return node.value;
    return null;
  }
  seek() {
    const node = this.#list.head;
    if (node !== null) return node.value;
    return null;
  }
  seekLast() {
    const node = this.#list.tail;
    if (node !== null) return node.value;
    return null;
  }
  clear() {
    this.#list.clear();
  }
  *#traverse() {
    let curr = this.#list.head;
    while (curr) {
      yield curr.value;
      curr = curr.next;
    }
  }
  [Symbol.iterator]() {
    return this.#traverse();
  }
  forEach(cb) {
    for (const value of this) {
      cb(value);
    }
  }
}
