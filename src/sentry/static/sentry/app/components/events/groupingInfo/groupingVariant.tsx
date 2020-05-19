import React from 'react';
import styled from '@emotion/styled';
import capitalize from 'lodash/capitalize';

import {t} from 'sentry/locale';
import KeyValueList from 'sentry/components/events/interfaces/keyValueList/keyValueList';
import {
  EventGroupVariant,
  EventGroupVariantType,
  EventGroupComponent,
} from 'sentry/types';
import ButtonBar from 'sentry/components/buttonBar';
import Button from 'sentry/components/button';
import theme from 'sentry/utils/theme';
import {IconCheckmark, IconClose} from 'sentry/icons';
import space from 'sentry/styles/space';
import Tooltip from 'sentry/components/tooltip';

import {hasNonContributingComponent} from './utils';
import GroupingComponent from './groupingComponent';

type Props = {
  variant: EventGroupVariant;
};

type State = {
  showNonContributing: boolean;
};

type VariantData = [string, React.ReactNode][];

class GroupVariant extends React.Component<Props, State> {
  state = {
    showNonContributing: false,
  };

  handleShowNonContributing = () => {
    this.setState({showNonContributing: true});
  };

  handleHideNonContributing = () => {
    this.setState({showNonContributing: false});
  };

  getVariantData(): [VariantData, EventGroupComponent | undefined] {
    const {variant} = this.props;
    const data: VariantData = [[t('Type'), variant.type]];
    let component: EventGroupComponent | undefined;

    if (variant.hash !== null) {
      data.push([t('Hash'), variant.hash]);
    }

    if (variant.hashMismatch) {
      data.push([
        t('Hash mismatch'),
        t('hashing algorithm produced a hash that does not match the event'),
      ]);
    }

    switch (variant.type) {
      case EventGroupVariantType.COMPONENT:
        component = variant.component;
        if (variant.config?.id) {
          data.push([t('Grouping Config'), variant.config.id]);
        }
        break;
      case EventGroupVariantType.CUSTOM_FINGERPRINT:
        if (variant.values) {
          data.push([t('Fingerprint values'), variant.values]);
        }
        break;
      case EventGroupVariantType.SALTED_COMPONENT:
        component = variant.component;
        if (variant.values) {
          data.push([t('Fingerprint values'), variant.values]);
        }
        if (variant.config?.id) {
          data.push([t('Grouping Config'), variant.config.id]);
        }
        break;
      default:
        break;
    }

    if (component) {
      data.push([
        t('Grouping'),
        <GroupingTree key={component.id}>
          <GroupingComponent
            component={component}
            showNonContributing={this.state.showNonContributing}
          />
        </GroupingTree>,
      ]);
    }

    return [data, component];
  }

  renderTitle() {
    const {variant} = this.props;
    const isContributing = variant.hash !== null;

    return (
      <Tooltip
        title={isContributing ? t('Contributing variant') : t('Non-contributing variant')}
      >
        <VariantTitle>
          <ContributionIcon isContributing={isContributing} />
          {t('By')}{' '}
          {variant.description
            .split(' ')
            .map(i => capitalize(i))
            .join(' ')}
        </VariantTitle>
      </Tooltip>
    );
  }

  renderContributionToggle() {
    const {showNonContributing} = this.state;

    return (
      <ButtonBar merged active={showNonContributing ? 'all' : 'relevant'}>
        <Button barId="relevant" size="xsmall" onClick={this.handleHideNonContributing}>
          {t('Contributing values')}
        </Button>
        <Button barId="all" size="xsmall" onClick={this.handleShowNonContributing}>
          {t('All values')}
        </Button>
      </ButtonBar>
    );
  }

  render() {
    const [data, component] = this.getVariantData();

    return (
      <VariantWrapper>
        <Header>
          {this.renderTitle()}
          {hasNonContributingComponent(component) && this.renderContributionToggle()}
        </Header>

        <KeyValueList data={data} isContextData isSorted={false} />
      </VariantWrapper>
    );
  }
}

const VariantWrapper = styled('div')`
  margin-bottom: ${space(4)};
`;

const Header = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${space(2)};
`;

const VariantTitle = styled('h5')`
  font-size: ${p => p.theme.fontSizeMedium};
  margin: 0;
  display: flex;
  align-items: center;
`;

const ContributionIcon = styled(({isContributing, ...p}) =>
  isContributing ? (
    <IconCheckmark size="sm" isCircled color={theme.green} {...p} />
  ) : (
    <IconClose size="sm" isCircled color={theme.red} {...p} />
  )
)`
  margin-right: ${space(1)};
`;

const GroupingTree = styled('div')`
  color: #2f2936;
`;

export default GroupVariant;