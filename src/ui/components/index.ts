import { ResourceDisplay, ResourceDisplayOptions } from './resourceDisplay';
import { ClickArea, ClickAreaOptions } from './clickArea';
import { GeneratorList } from './generatorList';
import { GeneratorItem } from './generatorItem';
import { Shop } from './shop';
import { ShopItem } from './shopItem';
import { UpgradeList } from './upgradeList';
import { UpgradeItem } from './upgradeItem';
import { ProductionStats } from './productionStats'; // Import the new component

// Export all component classes
export {
  ResourceDisplay,
  ClickArea,
  GeneratorList,
  GeneratorItem,
  Shop,
  ShopItem,
  UpgradeList,
  UpgradeItem,
  ProductionStats
};

// Factory functions to create components

/**
 * Create a resource display component
 */
export function createResourceDisplay(options?: ResourceDisplayOptions): ResourceDisplay {
  return new ResourceDisplay(options);
}

/**
 * Create a click area component
 */
export function createClickArea(options?: ClickAreaOptions): ClickArea {
  return new ClickArea(options);
}

/**
 * Create a generator list component
 */
export function createGeneratorList(containerId?: string): GeneratorList {
  return new GeneratorList({ id: containerId });
}

/**
 * Create a shop component
 */
export function createShop(containerId?: string): Shop {
  return new Shop({ id: containerId });
}

/**
 * Create an upgrade list component
 */
export function createUpgradeList(containerId?: string): UpgradeList {
  return new UpgradeList({ id: containerId });
}

/**
 * Create a production stats component
 */
export function createProductionStats(containerId?: string): ProductionStats {
  return new ProductionStats({ id: containerId });
}

/**
 * Initialize all UI components
 */
export function initializeUI(): {
  resourceDisplay: ResourceDisplay;
  clickArea: ClickArea;
  generatorList: GeneratorList;
  shop: Shop;
  upgradeList: UpgradeList;
  productionStats: ProductionStats;
} {
  const resourceDisplay = createResourceDisplay({
    id: 'resource-display'
  });
  
  const clickArea = createClickArea({
    id: 'frog-display'
  });
  
  const generatorList = createGeneratorList('owned-generators');
  const shop = createShop('buildings-container');
  const upgradeList = createUpgradeList('upgrades-container');
  const productionStats = createProductionStats('production-stats');
  
  // Initialize all components
  resourceDisplay.init();
  clickArea.init();
  generatorList.init();
  shop.init();
  upgradeList.init();
  productionStats.init();
  
  return {
    resourceDisplay,
    clickArea,
    generatorList,
    shop,
    upgradeList,
    productionStats
  };
}