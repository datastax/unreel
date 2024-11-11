type MiniAstraOptions = {
  token: string;
  endpoint: string;
};

const DEFAULT_KEYSPACE = "default_keyspace";

export class MiniAstra {
  endpoint: string;
  headers: {
    Token: string;
    UserAgent: "mini-astra/unreel";
    Accept: "application/json";
    "Content-Type": "application/json";
  };

  constructor({ token, endpoint }: MiniAstraOptions) {
    this.endpoint = endpoint;
    this.headers = {
      Token: token,
      UserAgent: "mini-astra/unreel",
      Accept: "application/json",
      "Content-Type": "application/json",
    };
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
        headers: this.headers,
        body: JSON.stringify({ find: { options } }),
      });
      const data = await response.json();
      documents.push(...data.data.documents);
      nextPageState = data.data.nextPageState;
    }
    return documents;
  }

  async updateOne(
    collection: string,
    {
      filter = {},
      sort = {},
      update = {},
      options = {},
    }: { filter?: {}; sort?: {}; update?: {}; options?: {} }
  ) {
    const url = new URL(
      `${this.endpoint}/api/json/v1/${DEFAULT_KEYSPACE}/${collection}`
    );
    // write this as a findOneAndUpdate with upsert: true
    const params = {
      updateOne: {
        filter,
        sort,
        update,
        options,
      },
    };
    await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(params),
    })
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((error) => {
        throw error;
      });
  }
}

export const miniAstra = new MiniAstra({
  endpoint: process.env.ASTRA_DB_ENDPOINT_URL!,
  token: process.env.ASTRA_DB_TOKEN!,
});
