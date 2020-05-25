import {BreadcrumbDetails, BreadcrumbType, BreadcrumbLevelType} from '../types';

type OptionBase = {
  symbol: React.ReactNode;
  isChecked: boolean;
  description?: string;
};

export type OptionType = {
  type: BreadcrumbType;
  levels: Array<BreadcrumbLevelType>;
} & OptionBase;

export type OptionLevel = {
  type: BreadcrumbLevelType;
  symbol: React.ReactNode;
  isChecked: boolean;
  description?: string;
} & OptionBase;

export type Option = OptionType | OptionLevel;

export {BreadcrumbDetails};
