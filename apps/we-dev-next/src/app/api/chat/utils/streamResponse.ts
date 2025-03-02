import { v4 as uuidv4 } from "uuid";
import { Messages, StreamingOptions, streamTextFn } from "../action";
import { CONTINUE_PROMPT } from "../prompt";
import { deductUserTokens, estimateTokens } from "@/utils/tokens";
import SwitchableStream from "../switchable-stream";

const MAX_RESPONSE_SEGMENTS = 2;

export async function streamResponse(
  messages: Messages,
  model: string,
  userId: string | null
): Promise<Response> {
  const stream = new SwitchableStream();
  const options: StreamingOptions = {
    toolChoice: "none",
    onFinish: async (response) => {
      const { text: content, finishReason } = response;
      if (finishReason !== "length") {
        const tokens = estimateTokens(content);
        if (userId) {
          await deductUserTokens(userId, tokens);
        }
        return stream.close();
      }

      if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
        throw Error("Cannot continue message: Maximum segments reached");
      }

      messages.push({ id: uuidv4(), role: "assistant", content });
      messages.push({ id: uuidv4(), role: "user", content: CONTINUE_PROMPT });

      const result = streamTextFn(messages, options, model);
      result.toDataStreamResponse({
        sendReasoning: true,
      });
    },
  };

  const result = await streamTextFn(messages, options, model);
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
