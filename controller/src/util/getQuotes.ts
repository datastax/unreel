import { fallbackQuotes, defaultGameOptions } from "../../../common/util";
import { shuffle } from "./shuffle";
import { miniAstra } from "./miniAstra";

export const getQuotes = async (
  numberOfQuestions: number = defaultGameOptions.numberOfQuestions,
  backend: BackendOptions = defaultGameOptions.backend
) => {
  if (backend === "Langflow") {
    return await getQuotesFromLangflow(numberOfQuestions);
  }
  return await getQuotesFromAstra(numberOfQuestions);
};

export const getQuotesFromAstra = async (numberOfQuestions: number) => {
  const questions = await miniAstra.findFromCollection("questions");
  return shuffle(questions).slice(0, numberOfQuestions);
};

const getQuotesFromLangflow = async (numberOfQuestions: number) => {
  let response: any;
  try {
    // First try render
    response = await fetch(process.env.LANGFLOW_FALLBACK_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_value: `${numberOfQuestions}`,
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
        input_value: `${numberOfQuestions}`,
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
