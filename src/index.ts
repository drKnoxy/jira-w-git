import * as service from "./service";
import { h, renderToDOM } from "./h";
import { parents, logError } from "./utils";

main();

function main() {
  // Mount our sync button
  const btnToolbar = document.querySelector(".ghx-view-section ");

  // If JIRA hasn't fired up their app then try again in a tick
  if (!btnToolbar) {
    setTimeout(() => main(), 500);
    return;
  }

  btnToolbar.prepend(
    h("button", {
      type: "button",
      className: "aui-button",
      innerText: "↯ Github",
      onclick: () => updateTicketsWithGithubInfo()
    })
  );

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
    const prs = await service.getPRs();
    const reviewSets = await Promise.all(prs.map(pr => service.getReviews(pr.url)));
    const ticketData: service.TPull[] = prs.map((pr, i) => ({
      ...pr,
      reviews: {
        ...pr.reviews,
        ...reviewSets[i]
      }
    }));

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
  } catch (error) {
    logError(error);
  }

  // @ts-ignore
  window.require("atlassian/analytics/user-activity-xhr-header").install();
}

// The dom we are building out
function ticketNotes(props: service.TPull) {
  return h("div", {
    children: [
      h("img", {
        className: "owner",
        src: props.owner.photo,
        title: props.owner.displayName
      }),

      ...Object.values(props.reviews).map(r =>
        h("div", {
          className: {
            reviewer: true,
            "reviewer--approved": r.state === service.API_STATES.APPROVED,
            "reviewer--failed": r.state === service.API_STATES.REQUEST_CHANGES,
            "reviewer--pending": r.state === service.API_STATES.PENDING
          },
          children: [
            h("img", {
              className: "reviewer__img",
              src: r.photo,
              title: r.displayName
            }),
            h("span", {
              innerText: (function() {
                switch (r.state) {
                  case service.API_STATES.APPROVED:
                    return "👍";
                  case service.API_STATES.REQUEST_CHANGES:
                    return "👎";
                  case service.API_STATES.PENDING:
                    return "👀";
                }
              })(),
              className: "reviewer__icon"
            })
          ]
        })
      )
    ]
  });
}
