// import openai
import { openai } from "../openai.ts";

export interface RequestBody {
  document: string;
  rule: string;
}

export interface ResponseBody {
  pass: boolean;
}

export const handleCheck = async (req: Request): Promise<Response> => {
  const { document, rule } = (await req.json()) as RequestBody;

  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a linter. You are given first a rule and then document. You must decide whether the document passes the rule.`,
      },
      {
        role: "user",
        content: `${rule}`,
      },
      {
        role: "user",
        content: `${document}`,
      },
      {
        role: "system",
        content: "You must respond with one word: 'pass' or 'fail'",
      },
    ],
  });

  const result = completion.data.choices[0].message?.content;
  console.log("result", rule, result);

  if (!result) throw new Error("No result from OpenAI");

  return new Response(
    JSON.stringify({
      pass: result.toLowerCase() === "pass",
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }
  );
};
