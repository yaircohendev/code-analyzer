import { AnalyzerPlugin } from "../models/plugin.model";
import { AnalyzeResults } from "../models/analyze.model";
import axios from "axios";
import { BasePlugin } from "../../plugins/analyze-plugin";

interface CoralogixProcessorConfig {
  clusterURL?: string;
  applicationName?: string;
  subsystemName?: string;
}

export class CoralogixPlugin implements AnalyzerPlugin {
  async onAllFinishProcessing(items: AnalyzeResults, plugin: BasePlugin) {
    const config = plugin.options?.params as CoralogixProcessorConfig;
    const url =
      (config && config.clusterURL) ?? "https://api.coralogix.com/api/v1/logs";
    console.log("Sending logs to Coralogix");
    try {
      const result = (
        await axios.post(url, {
          privateKey: process.env.CGX_PRIVATE_KEY,
          applicationName:
            (config && config.applicationName) ?? "code-analyzer",
          subsystemName: (config && config.subsystemName) ?? "code-analyzer",
          logEntries: items,
        })
      ).data;
      console.log(result);
    } catch (e) {
      console.error(e);
    }
  }
}

export default CoralogixPlugin;
