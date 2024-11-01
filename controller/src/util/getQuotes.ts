import { fallbackQuotes } from "../../../common/util";
import { shuffle } from "./shuffle";

export const getQuotes = async () => {
  try {
    const quotes = await fetch(process.env.LANGFLOW_API_URL!, {
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
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.dir(data, { depth: Infinity });
        const real = JSON.parse(data.outputs[0].outputs[0].results.text.text);
        const fake = JSON.parse(data.outputs[0].outputs[1].results.text.text);
        return shuffle([...real.quotes, ...fake.quotes]);
      });
    return quotes;
  } catch {
    return fallbackQuotes;
  }
};
