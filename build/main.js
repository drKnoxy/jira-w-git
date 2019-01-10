// User specific
const username = "YOUR_USERNAME";
const key = "YOUR_KEY";

const API_STATES = {
    APPROVED: "APPROVED",
    REQUEST_CHANGES: "REQUEST_CHANGES",
    PENDING: "PENDING"
};
const get = (url) => fetch(url, {
    method: "GET",
    headers: {
        Authorization: `Basic ${btoa(username + ":" + key)}`,
        "Content-Type": "application/json"
    }
}).then(res => res.json());
const getPRs = () => {
    return get("https://api.github.com/repos/BoomTownROI/flagship-cutter/pulls").then(formatPRResponse);
    function formatPRResponse(prs) {
        return prs.map(pr => {
            const reviews = [...pr.assignees, ...pr.requested_reviewers]
                .filter(a => a.id !== pr.user.id)
                .reduce((prev, a) => (Object.assign({}, prev, { [a.id]: {
                    photo: a.avatar_url,
                    displayName: a.login,
                    state: API_STATES.PENDING
                } })), {});
            let ticketID;
            const parsedID = pr.title.match(/^CNS-[\d]+/);
            if (parsedID === null) {
                console.warn("Couldn't parse id from ticket title", Object.assign({}, pr));
                ticketID = "---";
            }
            else {
                ticketID = parsedID[0];
            }
            return {
                ticketID,
                title: pr.title,
                owner: {
                    photo: pr.user.avatar_url,
                    displayName: pr.user.login
                },
                reviews,
                url: pr.url
            };
        });
    }
};
const getReviews = (prURL) => {
    return get(`${prURL}/reviews`)
        .then(res => res.filter(filterReviews))
        .then(formatReviews);
    function formatReviews(res) {
        return res.reduce((prev, rev) => (Object.assign({}, prev, { [rev.user.id]: {
                photo: rev.user.avatar_url,
                displayName: rev.user.login,
                state: rev.state
            } })), {});
    }
    function filterReviews(rev) {
        return [API_STATES.APPROVED, API_STATES.REQUEST_CHANGES].includes(rev.state);
    }
};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
}

function renderToDOM(tree, el) {
    const MOUNT_KEY = "jira-w-github";
    if (el === null) {
        return;
    }
    // out with the old
    const old = el.querySelector(`.${MOUNT_KEY}`);
    if (old !== null)
        old.innerHTML = '';
    const wrapper = h("div", { className: MOUNT_KEY, children: [tree] });
    el.appendChild(wrapper);
}
function h(type, props) {
    const { children = [], className = "" } = props, rest = __rest(props, ["children", "className"]);
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

function parents(elem, selector) {
    var firstChar = selector.charAt(0);
    var parents = [];
    // Get closest match
    for (; elem && elem !== document; elem = elem.parentNode) {
        if (firstChar === ".") {
            if (elem.classList.contains(selector.substr(1))) {
                parents.push(elem);
            }
        }
        else if (firstChar === "#") {
            if (elem.id === selector.substr(1)) {
                parents.push(elem);
            }
        }
        else if (firstChar === "[") {
            if (elem.hasAttribute(selector.substr(1, selector.length - 1))) {
                parents.push(elem);
            }
        }
    }
    if (parents.length === 0) {
        return false;
    }
    else {
        return parents;
    }
}
function logError(...args) {
    console.warn("👮‍♀️ JIRA/w/GITHUB", ...args);
}

main();
function main() {
    // Mount our sync button
    const btnToolbar = document.querySelector(".ghx-view-section ");
    // If JIRA hasn't fired up their app then try again in a tick
    if (!btnToolbar) {
        setTimeout(() => main(), 500);
        return;
    }
    btnToolbar.prepend(h("button", {
        type: "button",
        className: "aui-button",
        innerText: "↯ Github",
        onclick: () => updateTicketsWithGithubInfo()
    }));
    const s = document.createElement("style");
    s.type = "text/css";
    s.appendChild(document.createTextNode(getStyles()));
    // @ts-ignore
    document.head.appendChild(s);
}
///////////////////////
function getStyles() {
    return `
    .ghx-issue-content .github-info {
      margin-top: 8px;
    }
    .ghx-issue-content .owner,
    .ghx-issue-content .reviewer {
      width: 30px;
      height: 30px;
      margin-right: 10px;
      position: relative;
      display: inline-block;
    }
    .ghx-issue-content .reviewer__icon {
      position: absolute;
      line-height: 30px;
      left: 50%;
      transform: translate(-50%,0);
      font-size: 16px;
      color: white;
      text-shadow: 0 0 1px black;
    }
    .ghx-issue-content .reviewer__img {
      max-width: 100%;
    }
    .ghx-issue-content .reviewer--failed {
      color: black;
      text-shadow: 0 0 1px white;
    }
  `;
}
async function updateTicketsWithGithubInfo() {
    // These jerks overwrote window.fetch
    // @ts-ignore
    window.require("atlassian/analytics/user-activity-xhr-header").uninstall();
    try {
        // Get the data
        const prs = await getPRs();
        const reviewSets = await Promise.all(prs.map(pr => getReviews(pr.url)));
        const ticketData = prs.map((pr, i) => (Object.assign({}, pr, { reviews: Object.assign({}, pr.reviews, reviewSets[i]) })));
        // Render html into each ticket
        ticketData.forEach(t => {
            const childTarget = document.querySelector(`.ghx-key > a[title="${t.ticketID}"]`);
            if (childTarget === null) {
                logError("Couldn't find child target");
                return;
            }
            const target = parents(childTarget, ".ghx-issue-content");
            if (target === false) {
                logError("Couldn't find parent of target");
                return;
            }
            renderToDOM(ticketNotes(t), target[0]);
        });
    }
    catch (error) {
        logError(error);
    }
    // @ts-ignore
    window.require("atlassian/analytics/user-activity-xhr-header").install();
}
// The dom we are building out
function ticketNotes(props) {
    return h("div", {
        children: [
            h("img", {
                className: "owner",
                src: props.owner.photo,
                title: props.owner.displayName
            }),
            ...Object.values(props.reviews).map(r => h("div", {
                className: {
                    reviewer: true,
                    "reviewer--approved": r.state === API_STATES.APPROVED,
                    "reviewer--failed": r.state === API_STATES.REQUEST_CHANGES,
                    "reviewer--pending": r.state === API_STATES.PENDING
                },
                children: [
                    h("img", {
                        className: "reviewer__img",
                        src: r.photo,
                        title: r.displayName
                    }),
                    h("span", {
                        innerText: (function () {
                            switch (r.state) {
                                case API_STATES.APPROVED:
                                    return "👍";
                                case API_STATES.REQUEST_CHANGES:
                                    return "👎";
                                case API_STATES.PENDING:
                                    return "👀";
                            }
                        })(),
                        className: "reviewer__icon"
                    })
                ]
            }))
        ]
    });
}
