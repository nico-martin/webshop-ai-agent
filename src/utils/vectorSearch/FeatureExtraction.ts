import { FeatureExtractionPipeline, pipeline } from "@huggingface/transformers";

class FeatureExtraction {
  private pipe: FeatureExtractionPipeline | null = null;

  public extract = async (text: string): Promise<Array<number>> => {
    if (!this.pipe) {
      const pipe = await pipeline(
        "feature-extraction",
        "onnx-community/all-MiniLM-L6-v2-ONNX",
        {
          progress_callback: console.log,
          device: "webgpu",
        }
      );
      this.pipe = pipe;
    }
    const output = await this.pipe(text, {
      pooling: "mean",
      normalize: true,
    });

    return output.tolist()[0];
  };
}

export default FeatureExtraction;
