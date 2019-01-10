export function renderToDOM(tree: HTMLElement, el: HTMLElement | null) {
  const MOUNT_KEY = "jira-w-github";
  if (el === null) {
    return;
  }

  // out with the old
  const old = el.querySelector(`.${MOUNT_KEY}`);
  if (old !== null) old.innerHTML = '';

  const wrapper = h("div", { className: MOUNT_KEY, children: [tree] });
  el.appendChild(wrapper);
}

type hProps = {
  children?: Node[];
  className?: string | { [cname: string]: boolean };
  [attr: string]: any;
};

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
