type MiniAstraOptions = {
  token: string;
  endpoint: string;
};

const DEFAULT_KEYSPACE = "default_keyspace";

export class MiniAstra {
  token: string;
  endpoint: string;

  constructor({ token, endpoint }: MiniAstraOptions) {
    this.token = token;
    this.endpoint = endpoint;
  }

  async findFromCollection(collection: string) {
    const url = new URL(
      `${this.endpoint}/api/json/v1/${DEFAULT_KEYSPACE}/${collection}`
    );
    const documents = [];
    let started = false;
    let nextPageState = "";
    while (!started || nextPageState) {
      started = true;
      let options: { pagingState?: string } = {};
      if (nextPageState) {
        options["pagingState"] = nextPageState;
      }
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Token: this.token,
          UserAgent: "mini-astra/unreel",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ find: { options } }),
      });
      const data = await response.json();
      documents.push(...data.data.documents);
      nextPageState = data.data.nextPageState;
    }
    return documents;
  }
}
