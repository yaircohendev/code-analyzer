import { ConfigModel } from "../shared/models/config.model";
import { merge } from "lodash";
import { DEFAULT_PLUGINS } from "./constants";
import { argv } from "../env";
import { BasePlugin } from "../modules/analyzer/plugin-analyzer/analyze-plugin";
import { PluginOptions } from "../shared/models/plugins/plugin.model";
import path from "path";
import { supportedPlugins } from "../shared/plugins/constants/plugins.constants";

const PLUGINS_FOLDER = "plugins";

export class Config {
  data: ConfigModel;
  plugins!: BasePlugin[];

  constructor(config: ConfigModel) {
    const defaultConfig: ConfigModel = {
      repoPath: argv.repoPath ?? "./",
    };
    this.data = merge(defaultConfig, config);
  }

  async init() {
    this.plugins = await this.getAllPlugins();
  }

  private async getAllPlugins(): Promise<BasePlugin[]> {
    const plugins = this.data.plugins ?? argv.plugins?.split(",") ?? [];
    const pluginsInstances: BasePlugin[] = [];

    for (const plugin of plugins) {
      let pluginPath = plugin;
      if (supportedPlugins[plugin]) {
        pluginPath = `${PLUGINS_FOLDER}/${plugin}`;
      }
      let pluginConfig = plugin;
      pluginConfig = (
        typeof pluginConfig === "string"
          ? {
              path: pluginPath,
            }
          : pluginConfig
      ) as PluginOptions;
      pluginConfig.path = path.join(process.cwd(), pluginConfig.path);
      if (pluginConfig.disabled) {
        continue;
      }
      const pluginClass = (await import(pluginConfig.path)).default;
      if (pluginConfig.disabled) {
        continue;
      }
      const pluginInstance = new BasePlugin(pluginClass, pluginConfig);
      pluginsInstances.push(pluginInstance);
    }

    for (const plugin of DEFAULT_PLUGINS) {
      const instance = new BasePlugin(plugin, {} as PluginOptions);
      pluginsInstances.push(instance);
    }

    return pluginsInstances;
  }
}
