import { key, username } from "./keys";

// Service work
type PRstates = "APPROVED" | "PENDING" | "REQUEST_CHANGES";
export const API_STATES: { [key: string]: PRstates } = {
  APPROVED: "APPROVED",
  REQUEST_CHANGES: "REQUEST_CHANGES",
  PENDING: "PENDING"
};

const get = <T>(url: string): Promise<T> =>
  fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${btoa(username + ":" + key)}`,
      "Content-Type": "application/json"
    }
  }).then(res => res.json());

type RESPONSE_PULLS = {
  id: number;
  url: string;
  statuses_url: string;
  state: string;
  title: string;
  assignees: {
    login: string;
    id: number;
    avatar_url: string;
  }[];
  requested_reviewers: {
    login: string;
    id: number;
    avatar_url: string;
  }[];
  user: {
    login: string;
    id: number;
    avatar_url: string;
  };
}[];

export type TPull = {
  ticketID: string;
  title: string;
  owner: {
    photo: string;
    displayName: string;
  };
  url: string;
  reviews: TReviews;
};
export const getPRs = (): Promise<TPull[]> => {
  return get<RESPONSE_PULLS>("https://api.github.com/repos/BoomTownROI/flagship-cutter/pulls").then(
    formatPRResponse
  );

  function formatPRResponse(prs: RESPONSE_PULLS): TPull[] {
    return prs.map(pr => {
      const reviews: TReviews = [...pr.assignees, ...pr.requested_reviewers]
        .filter(a => a.id !== pr.user.id)
        .reduce(
          (prev, a) => ({
            ...prev,
            [a.id]: {
              photo: a.avatar_url,
              displayName: a.login,
              state: API_STATES.PENDING
            }
          }),
          {}
        );

      let ticketID: string;
      const parsedID = pr.title.match(/^CNS-[\d]+/);
      if (parsedID === null) {
        console.warn("Couldn't parse id from ticket title", { ...pr });
        ticketID = "---";
      } else {
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

type RESPONSE_REVIEWS = RESPONSE_REVIEW[];
type RESPONSE_REVIEW = {
  id: number;
  user: {
    login: string;
    id: number;
    avatar_url: string;
  };
  state: PRstates;
};

export type TReviews = {
  [id: string]: {
    photo: string;
    displayName: string;
    state: PRstates;
  };
};
export const getReviews = (prURL: string): Promise<TReviews> => {
  return get<RESPONSE_REVIEWS>(`${prURL}/reviews`)
    .then(res => res.filter(filterReviews))
    .then(formatReviews);

  function formatReviews(res: RESPONSE_REVIEWS): TReviews {
    return res.reduce(
      (prev, rev) => ({
        ...prev,
        [rev.user.id]: {
          photo: rev.user.avatar_url,
          displayName: rev.user.login,
          state: rev.state
        }
      }),
      {}
    );
  }

  function filterReviews(rev: RESPONSE_REVIEW): boolean {
    return [API_STATES.APPROVED, API_STATES.REQUEST_CHANGES].includes(rev.state);
  }
};
