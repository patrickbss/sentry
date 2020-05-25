import React from 'react';
import styled from '@emotion/styled';
import pick from 'lodash/pick';
import omit from 'lodash/omit';

import EventDataSection from 'app/components/events/eventDataSection';
import GuideAnchor from 'app/components/assistant/guideAnchor';
import EmptyMessage from 'app/views/settings/components/emptyMessage';
import {t} from 'app/locale';
import {Event} from 'app/types';
import space from 'app/styles/space';
import SearchBar from 'app/components/searchBar';
import Button from 'app/components/button';
import {IconWarning} from 'app/icons/iconWarning';
import {defined} from 'app/utils';

import {
  Breadcrumb,
  BreadcrumbDetails,
  BreadcrumbType,
  BreadcrumbLevelType,
} from './types';
import {Filter} from './filter/filter';
import convertBreadcrumbType from './convertBreadcrumbType';
import getBreadcrumbTypeDetails from './getBreadcrumbTypeDetails';
// import {FilterGroupType} from './filter/types';
import BreadcrumbsListHeader from './breadcrumbsListHeader';
import BreadcrumbsListBody from './breadcrumbsListBody';
import BreadcrumbIcon from './breadcrumbIcon';

const MAX_CRUMBS_WHEN_COLLAPSED = 10;

type BreadcrumbWithDetails = Breadcrumb & BreadcrumbDetails & {id: number};
type FilterOptions = React.ComponentProps<typeof Filter>['options'];

type State = {
  isCollapsed: boolean;
  searchTerm: string;
  breadcrumbs: Array<BreadcrumbWithDetails>;
  filteredByFilter: Array<BreadcrumbWithDetails>;
  filteredByCustomSearch: Array<BreadcrumbWithDetails>;
  filteredBreadcrumbs: Array<BreadcrumbWithDetails>;
  filterOptions: FilterOptions;
};

type Props = {
  event: Event;
  orgId: string | null;
  type: string;
  data: {
    values: Array<Breadcrumb>;
  };
};

class BreadcrumbsContainer extends React.Component<Props, State> {
  state: State = {
    isCollapsed: true,
    searchTerm: '',
    breadcrumbs: [],
    filteredByFilter: [],
    filteredByCustomSearch: [],
    filteredBreadcrumbs: [],
    filterOptions: [[], []],
  };

  componentDidMount() {
    this.loadBreadcrumbs();
  }

  loadBreadcrumbs = () => {
    const {data} = this.props;
    let breadcrumbs = data.values;

    // Add the error event as the final (virtual) breadcrumb
    const virtualCrumb = this.getVirtualCrumb();
    if (virtualCrumb) {
      breadcrumbs = [...breadcrumbs, virtualCrumb];
    }

    const tranformedBreadcrumbs = this.getTransformedBreadcrumbs(breadcrumbs);
    const filterOptions = this.getFilterOptions(tranformedBreadcrumbs);

    this.setState({
      breadcrumbs: tranformedBreadcrumbs,
      filteredBreadcrumbs: tranformedBreadcrumbs,
      filteredByFilter: tranformedBreadcrumbs,
      filteredByCustomSearch: tranformedBreadcrumbs,
      filterOptions,
    });
  };

  getTransformedBreadcrumbs = (breadcrumbs: Array<Breadcrumb>) => {
    return breadcrumbs.map((breadcrumb, index) => {
      const convertedBreadcrumb = convertBreadcrumbType(breadcrumb);
      const breadcrumbTypeDetails = getBreadcrumbTypeDetails(convertedBreadcrumb.type);
      return {
        id: index,
        ...convertedBreadcrumb,
        ...breadcrumbTypeDetails,
      };
    });
  };

  getFilterOptions = (breadcrumbs: Array<BreadcrumbWithDetails>): FilterOptions => {
    const filterOptions: FilterOptions = [[], []];

    for (const index in breadcrumbs) {
      const types = this.getFilterTypes(filterOptions[1], breadcrumbs[index]);
      const levels = this.getFilterLevels(filterOptions[1], breadcrumbs[index]);

      filterOptions.push({
        types,
        levels,
      });
    }

    return [[], []];
  };

  getFilterTypes = (
    filterOption: FilterOptions[0],
    breadcrumb: BreadcrumbWithDetails
  ) => {
    const hasFilterOptionType = filterOption.find(f => f.type === breadcrumb.type);

    if (!hasFilterOptionType) {
      return {
        type: breadcrumb.type,
        description: breadcrumb.description,
        symbol: <BreadcrumbIcon {...omit(breadcrumb, 'description')} size="xs" />,
        levels: breadcrumb?.level ? [breadcrumb.level] : [],
        isChecked: true,
      };
    }

    // if (breadcrumb?.level && !hasFilterOptionType.levels.includes(breadcrumb.level)) {
    //   hasFilterOptionType.levels.push(breadcrumb.level);
    // }

    return undefined;
  };

  getFilterLevels = (
    filterOption: FilterOptions[1],
    breadcrumb: BreadcrumbWithDetails
  ) => {
    if (!breadcrumb?.level) {
      return undefined;
    }

    const hasFilterOptionLevel = filterOption.find(f => f.type === breadcrumb.level);

    if (hasFilterOptionLevel) {
      return undefined;
    }

    return {
      type: breadcrumb.level,
      symbol: <BreadcrumbIcon {...omit(breadcrumb, 'description')} size="xs" />,
      isChecked: true,
    };
  };

  moduleToCategory = (module: any) => {
    if (!module) {
      return undefined;
    }
    const match = module.match(/^.*\/(.*?)(:\d+)/);
    if (!match) {
      return module.split(/./)[0];
    }
    return match[1];
  };

  getVirtualCrumb = (): Breadcrumb | undefined => {
    const {event} = this.props;

    const exception = event.entries.find(
      entry => entry.type === BreadcrumbType.EXCEPTION
    );

    if (!exception && !event.message) {
      return undefined;
    }

    if (exception) {
      const {type, value, module: mdl} = exception.data.values[0];
      return {
        type: BreadcrumbType.ERROR,
        level: BreadcrumbLevelType.ERROR,
        category: this.moduleToCategory(mdl) || 'exception',
        data: {
          type,
          value,
        },
        timestamp: event.dateCreated,
      };
    }

    const levelTag = (event.tags || []).find(tag => tag.key === 'level');

    return {
      type: BreadcrumbType.ERROR,
      level: levelTag?.value as BreadcrumbLevelType,
      category: 'message',
      message: event.message,
      timestamp: event.dateCreated,
    };
  };

  getCollapsedCrumbQuantity = (): {
    filteredCollapsedBreadcrumbs: Array<BreadcrumbWithDetails>;
    collapsedQuantity: number;
  } => {
    const {isCollapsed, filteredBreadcrumbs} = this.state;

    let filteredCollapsedBreadcrumbs = filteredBreadcrumbs;

    if (isCollapsed && filteredCollapsedBreadcrumbs.length > MAX_CRUMBS_WHEN_COLLAPSED) {
      filteredCollapsedBreadcrumbs = filteredCollapsedBreadcrumbs.slice(
        -MAX_CRUMBS_WHEN_COLLAPSED
      );
    }

    return {
      filteredCollapsedBreadcrumbs,
      collapsedQuantity: filteredBreadcrumbs.length - filteredCollapsedBreadcrumbs.length,
    };
  };

  handleFilter = (filterGroups: any) => () => {};

  handleFilterBySearchTerm = (value: string) => {
    const {filteredByFilter} = this.state;

    const searchTerm = value.toLocaleLowerCase();

    const filteredBreadcrumbs = filteredByFilter.filter(obj =>
      Object.keys(
        pick(obj, ['type', 'category', 'message', 'level', 'timestamp', 'data'])
      ).some(key => {
        if (!defined(obj[key]) || !String(obj[key]).trim()) {
          return false;
        }
        return JSON.stringify(obj[key])
          .toLocaleLowerCase()
          .includes(searchTerm);
      })
    );

    this.setState({
      searchTerm,
      filteredBreadcrumbs,
    });
  };

  handleToggleCollapse = () => {
    this.setState(prevState => ({
      isCollapsed: !prevState.isCollapsed,
    }));
  };

  handleCleanSearch = () => {
    this.setState({
      searchTerm: '',
      isCollapsed: true,
    });
  };

  handleResetFilter = () => {};

  render() {
    const {type, event, orgId} = this.props;
    const {filterOptions, searchTerm} = this.state;

    const {
      collapsedQuantity,
      filteredCollapsedBreadcrumbs,
    } = this.getCollapsedCrumbQuantity();

    return (
      <EventDataSection
        type={type}
        title={
          <h3>
            <GuideAnchor target="breadcrumbs" position="bottom">
              {t('Breadcrumbs')}
            </GuideAnchor>
          </h3>
        }
        actions={
          <Search>
            <Filter onFilter={this.handleFilter} options={filterOptions} />
            <StyledSearchBar
              placeholder={t('Search breadcrumbs\u2026')}
              onChange={this.handleFilterBySearchTerm}
              query={searchTerm}
            />
          </Search>
        }
        wrapTitle={false}
        isCentered
      >
        <Content>
          {filteredCollapsedBreadcrumbs.length > 0 ? (
            <React.Fragment>
              <BreadcrumbsListHeader />
              <BreadcrumbsListBody
                event={event}
                orgId={orgId}
                onToggleCollapse={this.handleToggleCollapse}
                collapsedQuantity={collapsedQuantity}
                breadcrumbs={filteredCollapsedBreadcrumbs}
              />
            </React.Fragment>
          ) : (
            <EmptyMessage
              icon={<IconWarning size="xl" />}
              action={
                <Button onClick={this.handleResetFilter} priority="primary">
                  {t('Reset Filter')}
                </Button>
              }
            >
              {t('Sorry, no breadcrumbs match your search query.')}
            </EmptyMessage>
          )}
        </Content>
      </EventDataSection>
    );
  }
}

export default BreadcrumbsContainer;

const Content = styled('div')`
  border: 1px solid ${p => p.theme.borderDark};
  border-radius: ${p => p.theme.borderRadius};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  margin-bottom: ${space(3)};
`;

const Search = styled('div')`
  display: flex;
  width: 100%;
  margin-top: ${space(1)};

  @media (min-width: ${props => props.theme.breakpoints[1]}) {
    width: 400px;
    margin-top: 0;
  }

  @media (min-width: ${props => props.theme.breakpoints[3]}) {
    width: 600px;
  }
`;

const StyledSearchBar = styled(SearchBar)`
  width: 100%;
  .search-input {
    height: 32px;
  }
  .search-input,
  .search-input:focus {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  .search-clear-form,
  .icon-search {
    top: 0 !important;
    height: 32px;
    display: flex;
    align-items: center;
  }
`;
