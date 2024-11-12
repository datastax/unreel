import { fallbackQuotes, backends } from "../../../common/util";
import { shuffle } from "./shuffle";
import { MiniAstra } from "./miniAstra";

const miniAstra = new MiniAstra({
  endpoint: process.env.ASTRA_DB_ENDPOINT_URL!,
  token: process.env.ASTRA_DB_TOKEN!,
});

export const getQuotes = async (
  backend: (typeof backends)[number] = backends[0]
) => {
  if (backend === "Langflow") {
    return await getQuotesFromLangflow();
  }
  return await getQuotesFromAstra();
};

export const getQuotesFromAstra = async () => {
  const questions = await miniAstra.findFromCollection(
    process.env.ASTRA_DB_COLLECTION!
  );
  return shuffle(questions).slice(0, 10);
};

const getQuotesFromLangflow = async () => {
  let response: any;
  try {
    // First try render
    response = await fetch(process.env.LANGFLOW_FALLBACK_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_value: "10",
        output_type: "chat",
        input_type: "chat",
        tweaks: {},
      }),
    }).then((r) => r.json());
  } catch (e) {
    // If it fails, try DS Langflow
    console.log(`Render failed, using DS Langflow`, e);
    response = await fetch(process.env.LANGFLOW_API_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LANGFLOW_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_value: "10",
        output_type: "chat",
        input_type: "chat",
        tweaks: {},
      }),
    }).then((res) => {
      if (!res.ok) {
        throw new Error(`Langflow API returned ${res.status}`);
      }
      return res.json();
    });
  }

  console.log(`Got response from Langflow`, response);
  try {
    const real = JSON.parse(response.outputs[0].outputs[0].results.text.text);
    const fake = JSON.parse(response.outputs[0].outputs[1].results.text.text);
    return shuffle([...real.quotes, ...fake.quotes]);
  } catch (e) {
    console.log(`Processing Langflow response failed, using fallback`, e);
    return fallbackQuotes;
  }
};
