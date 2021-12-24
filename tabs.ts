import { BrowserHistoryPusher } from "./browser_history_pusher";
import { LazyInstance } from "@selfage/once/lazy_instance";

export interface Hideable {
  show: () => void;
  hide: () => void;
}

export class TabsNavigator {
  private keyToSetStateFns = new Map<string, (value: boolean) => void>();
  private keyToTabs = new Map<string, LazyInstance<Hideable>>();
  private hidePreviousTab: () => void = () => {};

  public constructor(private browserHistoryPusher: BrowserHistoryPusher) {}

  public add(
    tabKey: string,
    onStateChange: (callback: (newValue: boolean) => void) => void,
    setState: (value: boolean) => void,
    onClick: (callback: () => void) => void,
    createTabFactoryFn: () => Hideable,
  ): this {
    this.keyToSetStateFns.set(tabKey, setState);
    this.keyToTabs.set(tabKey, new LazyInstance(createTabFactoryFn));
    onStateChange((newValue) => this.handleStateChange(tabKey, newValue));
    onClick(() => this.handleClick(tabKey));
    return this;
  }

  private handleStateChange(tabKey: string, newValue: boolean): void {
    if (newValue) {
      this.hidePreviousTab();
      this.keyToTabs.get(tabKey).get().show();
      this.hidePreviousTab = () => this.hideTab(tabKey);
    } else {
      this.keyToTabs.get(tabKey).get().hide();
    }
  }

  private hideTab(tabKey: string): void {
    let setStateFn = this.keyToSetStateFns.get(tabKey);
    setStateFn(undefined);
  }

  private handleClick(tabKey: string): void {
    let setStateFn = this.keyToSetStateFns.get(tabKey);
    setStateFn(true);
    this.browserHistoryPusher.push();
  }
}
