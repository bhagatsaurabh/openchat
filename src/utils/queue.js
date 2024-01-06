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
    this.#list.popHead()?.value;
  }
  seek() {
    return this.#list.head?.value;
  }
  seekLast() {
    return this.#list.tail?.value;
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
