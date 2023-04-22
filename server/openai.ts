// openai from npm
import { Configuration, OpenAIApi } from "npm:openai";

// read $OPENAI_API_KEY from environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// If it doesn't exist, tell your homies to set it
if (!OPENAI_API_KEY) {
  console.error(
    "Please set the OPENAI_API_KEY environment variable (probably in your .zshrc) tbh"
  );
  Deno.exit(1);
}

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
export const openai = new OpenAIApi(configuration);
