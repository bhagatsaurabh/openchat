export class LinkedListNode {
  constructor(value) {
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

export class LinkedList {
  #length = 0;
  get length() {
    return this.#length;
  }

  constructor() {
    this.head = null;
    this.tail = null;
    this.#length = 0;
  }

  pushHead(value) {
    const newNode = new LinkedListNode(value);
    if (this.#length === 0) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.#length += 1;
    return newNode;
  }
  pushTail(value) {
    const newNode = new LinkedListNode(value);
    if (this.#length === 0) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.#length += 1;
    return newNode;
  }
  popHead() {
    if (this.#length === 0) return null;
    const node = this.head;
    this.head = this.head.next;
    if (this.head) {
      this.head.prev = null;
    } else {
      this.tail = null;
    }
    this.#length -= 1;
    node.next = null;
    return node;
  }
  popTail() {
    if (this.#length === 0) return null;
    const node = this.tail;
    this.tail = this.tail.prev;
    if (this.tail) {
      this.tail.next = null;
    } else {
      this.head = null;
    }
    this.#length -= 1;
    node.prev = null;
    return node;
  }
  clear() {
    this.head = null;
    this.tail = null;
    this.#length = 0;
  }
  seekHead() {
    return this.head;
  }
  seekTail() {
    return this.tail;
  }
  delete(node) {
    node.next.prev = node.prev;
    node.prev.next = node.next;
    node.next = null;
    node.prev = null;
    return node;
  }

  *#traverse() {
    let curr = this.head;
    while (curr) {
      yield curr;
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
