/**
 * Kinda like React.createElement
 */
export function h(type: string, props: hProps): HTMLElement {
  const { children = [], className = "", ...rest } = props;
  const el = document.createElement(type);
  Object.assign(el, rest);

  el.className =
    typeof className === "string"
      ? className
      : Object.entries(className)
          .filter(([key, val]) => Boolean(val))
          .map(([key, val]) => key)
          .join(" ");

  children.forEach(c => el.appendChild(c));

  return el;
}

export function renderToDOM(tree: HTMLElement, el: HTMLElement | null) {
  const MOUNT_KEY = "jira-w-github";
  if (el === null) {
    return;
  }

  // out with the old
  const old = el.querySelector(`.${MOUNT_KEY}`);
  if (old !== null) old.innerHTML = "";

  const wrapper = h("div", { className: MOUNT_KEY, children: [tree] });
  el.appendChild(wrapper);
}

type hProps = {
  children?: Node[];
  className?: string | { [cname: string]: boolean };
  [attr: string]: any;
};

export function replaceNode({ tree, target }: { tree: HTMLElement; target: string }) {
  const el = document.querySelector(target);
  if (el === null) {
    logError("Couldn't find node to replace");
    return;
  }
  el.replaceWith(tree);
}

export function onPushState(cb: () => void) {
  const originalFn = window.history.pushState;
  window.history.pushState = function() {
    // @ts-ignore
    const originalResp = originalFn.apply(this, arguments);
    cb();

    return originalResp;
  };
}

export function onPopState(cb: () => void) {
  window.addEventListener("popstate", () => {
    cb();
  });
}

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
