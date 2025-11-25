export const MODELS: Record<
  string,
  {
    modelId: string;
    title: string;
    dtype: "fp16" | "q4" | "q4f16";
    device: "webgpu";
    size: number;
    files: Record<string, number>;
  }
> = {
  granite350m: {
    modelId: "onnx-community/granite-4.0-350m-ONNX-web",
    title: "Granite-4.0 350M (fp16)",
    dtype: "fp16",
    device: "webgpu",
    size: 713_314_692,
    files: {
      "config.json": 2_018,
      "tokenizer.json": 4_131_199,
      "tokenizer_config.json": 24_271,
      "generation_config.json": 147,
      "onnx/model_fp16.onnx": 202_945,
      "onnx/model_fp16.onnx_data": 708_954_112,
    },
  },
  granite1B: {
    modelId: "onnx-community/granite-4.0-1b-ONNX-web",
    title: "Granite-4.0 1B (q4)",
    dtype: "q4",
    device: "webgpu",
    size: 1_785_693_098,
    files: {
      "tokenizer.json": 4_131_199,
      "tokenizer_config.json": 24_271,
      "config.json": 2_223,
      "onnx/model_q4.onnx": 389_658,
      "generation_config.json": 147,
      "onnx/model_q4.onnx_data": 1_781_145_600,
    },
  },
  granite3B: {
    modelId: "onnx-community/granite-4.0-micro-ONNX-web",
    title: "Granite-4.0 3B (q4f16)",
    dtype: "q4f16",
    device: "webgpu",
    size: 2_305_015_400,
    files: {
      "tokenizer.json": 4_131_199,
      "tokenizer_config.json": 23_947,
      "config.json": 2_149,
      "onnx/model_q4f16.onnx_data": 2_088_129_536,
      "onnx/model_q4f16.onnx": 391_777,
      "onnx/model_q4f16.onnx_data_1": 212_336_640,
      "generation_config.json": 152,
    },
  },
} as const;

export const SYSTEM_PROMPT = `You are a helpful AI assistant on an ecommerce website
You help the user navigate through the website, find products, and answer questions about products and services.\
Do not just make something up. Do not hallucinate.`;
