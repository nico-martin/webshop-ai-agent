import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  LinkIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import {
  AutoModelForCausalLM,
  AutoTokenizer,
  Message,
  PreTrainedModel,
  PreTrainedTokenizer,
  Tensor,
} from "@huggingface/transformers";
import { type FC, type ReactElement, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";

import { Category, Color, Size } from "../../store/products.ts";
import usePageContext from "../../store/provider/pageContext/usePageContext.ts";
import { Loader } from "../../theme";
import cn from "../../utils/classnames.ts";
import mdToHtml from "../../utils/converter/mdToHtml.ts";
import { MODELS, SYSTEM_PROMPT } from "../../utils/llm/constants.ts";
import {
  WebMCPTool,
  executeToolCall,
  extractToolCalls,
  webMCPToolToChatTemplateTool,
} from "../../utils/llm/webMcp.ts";
import findSimilarFAQs from "../../utils/vectorSearch/findSimilarFAQs.ts";
import ChatForm from "./ChatForm.tsx";

const Chat: FC = () => {
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const { pageContext } = usePageContext();

  const [thinking, setThinking] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const [callbackElements, setCallbackElements] = useState<Array<ReactElement>>(
    []
  );
  const [conversation, setConversation] = useState<Array<Message>>([
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ]);
  const tools: Array<WebMCPTool> = [
    {
      name: "get_current_item_context",
      description:
        "Get the current page context. Often its informations about the current product a user visits.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async () =>
        `# Current Page: ${pageContext.title}\n\n${pageContext.content}\n\nKeep in mind that the user navigates through the page and this info can change. So better call this function again after the user asks a similar question again!`,
    },
    {
      name: "open_product_overview",
      description: "open the product overview page with the given filters",
      inputSchema: {
        type: "object",
        properties: {
          categories: {
            type: "string",
            description: `Can be one of the following values: ${Object.values(Category).join(", ")}`,
            default: "",
          },
          colors: {
            type: "string",
            description: `Can be one of the following values: ${Object.values(Color).join(", ")}`,
            default: "",
          },
          sizes: {
            type: "string",
            description: `Can be one of the following values: ${Object.values(Size).join(", ")}`,
            default: "",
          },
        },
        required: [],
      },
      execute: async (args) => {
        const query = Object.entries(args)
          .filter(([, value]) => value)
          .map(([key, value]) => `${key}=${value}`)
          .join("&");
        navigate(`/products?${query}`);
        setCallbackElements((elements) => [
          ...elements,
          <p
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-white p-3 text-sm text-gray-500 shadow-md"
            )}
          >
            <CheckIcon className="size-8 text-lime-700" />
            <span>Open Product Overview with {query}</span>
          </p>,
        ]);
        return `Tell the user you just opened the product overview with ${query}`;
      },
    },
    {
      name: "search_faqs",
      description:
        "if the user asks any questions about the store, search for the right answer in the FAQs",
      inputSchema: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "The exact question the user asked optimized for similarity search.",
            default: "",
          },
        },
        required: [],
      },
      execute: async (args) => {
        const { question } = args;
        const similarFAQs = await findSimilarFAQs(question);
        setCallbackElements((elements) => [
          ...elements,
          <Disclosure
            key={similarFAQs.map((faq) => faq.id).join("-")}
            as="div"
            className="flex flex-col gap-1 rounded-lg border border-purple-300 bg-white p-3 text-sm"
          >
            <DisclosureButton className="group flex cursor-pointer items-center justify-between font-bold">
              <span className="group-data-[hover]:text-black/80">
                Sources ({similarFAQs.length})
              </span>
              <ChevronDownIcon className="size-4 group-data-[open]:rotate-180" />
            </DisclosureButton>
            <DisclosurePanel transition as="ul" className="mt-3 flex flex-col">
              {similarFAQs.map((faq) => (
                <li
                  className="mt-2 border-t border-gray-200 pt-2 first:mt-0 first:border-0 first:pt-0"
                  key={faq.id}
                >
                  <NavLink
                    className="group flex w-full items-center gap-1 text-purple-600"
                    to={`/services/faq?openFaq=${faq.id}`}
                  >
                    <LinkIcon className="size-4" />
                    <span>{faq.question}</span>
                    <ArrowRightIcon className="ml-auto size-4 -translate-x-1 opacity-0 transition group-hover:-translate-x-0 group-hover:opacity-100" />
                  </NavLink>
                </li>
              ))}
            </DisclosurePanel>
          </Disclosure>,
        ]);
        return similarFAQs
          .map(
            (faq) =>
              `Here are more informations to answer the question:\n\n${faq.question + "\n" + faq.answer}`
          )
          .join("\n\n");
      },
    },
  ];
  const pastKeyValues = useRef<any>(null);

  const pipe = useRef<{
    tokenizer: PreTrainedTokenizer;
    model: PreTrainedModel;
  }>(null);

  useEffect(() => {
    return () => {
      pipe.current && pipe.current.model.dispose();
    };
  }, []);

  const runLlm = async (
    prompt: string,
    role: "user" | "tool" = "user"
  ): Promise<string> => {
    const { modelId, device, dtype } = MODELS.granite3B;

    if (!pipe.current) {
      const [tokenizer, model] = await Promise.all([
        AutoTokenizer.from_pretrained(modelId, {
          progress_callback: console.log,
        }),
        AutoModelForCausalLM.from_pretrained(modelId, {
          dtype: dtype,
          device: device,
          progress_callback: console.log,
        }),
      ]);

      pipe.current = {
        tokenizer,
        model,
      };
    }

    const messages = conversation;

    messages.push({
      role,
      content: prompt,
    });

    console.log("Messages", messages);

    console.log(
      "Input Chat Template:",
      pipe.current.tokenizer.apply_chat_template(messages, {
        tools: tools.map(webMCPToolToChatTemplateTool),
        tokenize: false,
      })
    );

    const input = pipe.current.tokenizer.apply_chat_template(messages, {
      tools: tools.map(webMCPToolToChatTemplateTool),
      add_generation_prompt: true, // start with <|start_of_role|>assistant<|end_of_role|> so the model can start from there
      return_dict: true, // also returns the input_ids with the dictionary with named outputs
    }) as {
      input_ids: Tensor;
      attention_mask: number[] | number[][] | Tensor;
    };

    const started = performance.now();
    const { sequences, past_key_values } = (await pipe.current.model.generate({
      ...input,
      // @ts-expect-error
      max_new_tokens: 512,
      past_key_values: pastKeyValues.current,
      return_dict_in_generate: true,
    })) as { sequences: Tensor; past_key_values: any };
    const ended = performance.now();
    console.log("Time: ", ended - started, "ms");

    pastKeyValues.current = past_key_values;

    const lengthOfInput = input.input_ids.dims[1];
    const response = pipe.current.tokenizer.batch_decode(
      /**
       * First argument (null): Don't slice dimension 0 (the batch dimension) - keep all batches
       * Second argument ([lengthOfInput, Number.MAX_SAFE_INTEGER]): For dimension 1 (the sequence/token dimension), slice from index lengthOfInput to the end
       */
      sequences.slice(null, [lengthOfInput, Number.MAX_SAFE_INTEGER]),
      {
        skip_special_tokens: true, // removes the <|end_of_text|>
      }
    )[0];

    messages.push({
      role: "assistant",
      content: response,
    });

    setConversation(messages);

    return response;
  };

  const onAskLLM = async (question: string): Promise<string> => {
    let nextPrompt = question;
    let round = 0;
    const responses = [];
    while (nextPrompt) {
      const response = await runLlm(nextPrompt, round === 0 ? "user" : "tool");
      const { toolCalls, message } = extractToolCalls(response);
      if (toolCalls.length !== 0) {
        const toolResponses = await Promise.all(
          toolCalls.map((toolCall) => executeToolCall(toolCall, tools))
        );
        nextPrompt = toolResponses.map(({ result }) => result).join("\n\n");
      } else {
        nextPrompt = "";
      }

      responses.push(message);
      round++;
    }

    return responses.join("\n\n");
  };

  return (
    <>
      <div
        className={cn(
          "fixed right-4 bottom-24 flex w-md origin-bottom-right flex-col gap-4 rounded-lg border border-purple-400 bg-purple-50 p-6 shadow-xl transition duration-300",
          {
            "translate-x-0 translate-y-16 scale-15 opacity-0": !chatOpen,
          }
        )}
      >
        <h3 className="flex items-center gap-2">
          <SparklesIcon aria-hidden="true" className="size-4" /> Ask the Agent
        </h3>
        <ChatForm
          chatOpen={chatOpen}
          onSubmit={async (prompt) => {
            if (!prompt) {
              setResponse("");
              setCallbackElements([]);
              return;
            }

            setThinking(true);
            const resp = await onAskLLM(prompt);
            setResponse(resp);
            setThinking(false);
          }}
        />
        {(response.length !== 0 || thinking) && (
          <div className="mt-4">
            {thinking ? (
              <p className="flex items-center gap-3 font-light text-gray-500 italic">
                <Loader size={4} /> thinking..
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {callbackElements.map((element) => element)}
                <div
                  className="font-light text-gray-700 [&>li]:ml-5 [&>ol]:my-2 [&>ol]:ml-4 [&>ol]:list-decimal [&>ul]:my-2 [&>ul]:ml-5 [&>ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: mdToHtml(response) }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => setChatOpen((open) => !open)}
        className="fixed right-4 bottom-4 grid cursor-pointer rounded-full bg-purple-900 p-3 text-white outline-2 outline-offset-4 outline-purple-300 transition hover:outline-4 hover:outline-purple-900 focus:outline-4 focus:outline-purple-900"
      >
        <XMarkIcon
          aria-hidden="true"
          className={cn("col-start-1 row-start-1 size-8 transition", {
            "rotate-90 opacity-0": !chatOpen,
          })}
        />
        <SparklesIcon
          aria-hidden="true"
          className={cn("col-start-1 row-start-1 size-8 transition", {
            "-rotate-90 opacity-0": chatOpen,
          })}
        />
      </button>
    </>
  );
};

export default Chat;
