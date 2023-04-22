// import openai
import { openai } from "../openai.ts";

export interface RequestBody {
  document: string;
  rule: string;
}

export interface ResponseBody {
  pass: boolean;
}

type ResponseType =
  | {
      pass: true;
    }
  | {
      pass: false;
      message: string;
    };

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
        content: `<|RULE|>\n\n\n${rule}\n\n\n<|ENDRULE|>`,
      },
      {
        role: "user",
        content: `<|DOCUMENT|>\n\n\n${document}\n\n\n<|ENDDOCUMENT|>`,
      },
      {
        role: "system",
        content: `Respond in json this type.
type Response = {
  pass: true;
} | {
  pass: false;
  message: string;
}
        `,
      },
    ],
  });

  const result = completion.data.choices[0].message?.content;
  console.log("result", result);

  if (!result) throw new Error("No result from OpenAI");

  const r = JSON.parse(result) as ResponseType;

  return new Response(JSON.stringify(r), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};
