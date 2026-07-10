export class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
  ids = new Set<string>();
}

export class Trie {
  private root = new TrieNode();

  insert(word: string, id: string): void {
    let node = this.root;
    for (const ch of word.toLowerCase()) {
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
      node.ids.add(id);
    }
    node.isEnd = true;
  }

  search(prefix: string): Set<string> {
    let node = this.root;
    for (const ch of prefix.toLowerCase()) {
      const next = node.children.get(ch);
      if (!next) return new Set();
      node = next;
    }
    return new Set(node.ids);
  }

  clear(): void {
    this.root = new TrieNode();
  }
}
