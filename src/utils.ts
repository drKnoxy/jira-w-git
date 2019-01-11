/**
 * Find a parent based on selector
 */
export function parents(elem: any, selector: string) {
  var firstChar = selector.charAt(0);
  var parents = [];

  // Get closest match
  for (; elem && elem !== document; elem = elem.parentNode) {
    if (firstChar === ".") {
      if (elem.classList.contains(selector.substr(1))) {
        parents.push(elem);
      }
    } else if (firstChar === "#") {
      if (elem.id === selector.substr(1)) {
        parents.push(elem);
      }
    } else if (firstChar === "[") {
      if (elem.hasAttribute(selector.substr(1, selector.length - 1))) {
        parents.push(elem);
      }
    }
  }

  if (parents.length === 0) {
    return false;
  } else {
    return parents;
  }
}

export function logError(...args: any[]) {
  console.warn("👮‍♀️ JIRA/w/GITHUB", ...args);
}
