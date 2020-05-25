import React from 'react';
import styled from '@emotion/styled';
import isEqual from 'lodash/isEqual';
import {css} from '@emotion/core';

import {t, tn} from 'app/locale';
import DropdownControl from 'app/components/dropdownControl';
import DropdownButton from 'app/components/dropdownButton';

import {OptionsGroup} from './optionsGroup';
import {Header} from './header';
import {OptionType, OptionLevel, Option} from './types';

type Props = {
  onFilter: (options: Array<Option>) => () => void;
  options: [Array<OptionType>, Array<OptionLevel>];
};

type State = {
  options: [Array<OptionType>, Array<OptionLevel>];
  checkedQuantity: number;
};

class Filter extends React.Component<Props, State> {
  state: State = {
    options: [[], []],
    checkedQuantity: 0,
  };

  componentDidUpdate(prevProps: Props) {
    if (!isEqual(this.props.options, prevProps.options)) {
      this.loadState();
    }
  }
  loadState() {
    const {options} = this.props;
    this.setState({
      options,
    });
  }

  getDropDownButton = ({isOpen, getActorProps}) => {
    const checkedOptionsQuantity = 1;

    const dropDownButtonProps = {
      buttonLabel: t('Filter By'),
      buttonPriority: 'default',
      hasDarkBorderBottomColor: false,
    };

    if (checkedOptionsQuantity > 0) {
      dropDownButtonProps.buttonLabel = tn(
        '%s Active Filter',
        '%s Active Filters',
        checkedOptionsQuantity
      );
      dropDownButtonProps.buttonPriority = 'primary';
      dropDownButtonProps.hasDarkBorderBottomColor = true;
    }

    return (
      <StyledDropdownButton
        {...getActorProps()}
        isOpen={isOpen}
        hasDarkBorderBottomColor={dropDownButtonProps.hasDarkBorderBottomColor}
        size="small"
        priority={dropDownButtonProps.buttonPriority}
      >
        {dropDownButtonProps.buttonLabel}
      </StyledDropdownButton>
    );
  };

  handleClickItem = () => {};

  handleCheckAll = () => {};

  render() {
    const {options, checkedQuantity} = this.state;

    console.log('options', options);

    if (options[0].length === 0 && options[1].length === 0) {
      return null;
    }

    return (
      <Wrapper>
        <DropdownControl menuWidth="240px" blendWithActor button={this.getDropDownButton}>
          <React.Fragment>
            <Header
              onCheckAll={this.handleCheckAll}
              checkedQuantity={checkedQuantity}
              isAllChecked={false}
            />
            {options[0].length > 0 && (
              <OptionsGroup
                title={t('Type')}
                onClick={this.handleClickItem}
                data={options[0]}
              />
            )}

            {options[1].length > 0 && (
              <OptionsGroup
                title={t('Level')}
                onClick={this.handleClickItem}
                data={options[1]}
              />
            )}
          </React.Fragment>
        </DropdownControl>
      </Wrapper>
    );
  }
}

export {Filter};

const StyledDropdownButton = styled(DropdownButton)<{hasDarkBorderBottomColor?: boolean}>`
  border-right: 0;
  z-index: ${p => p.theme.zIndex.dropdown};
  border-radius: ${p =>
    p.isOpen
      ? `${p.theme.borderRadius} 0 0 0`
      : `${p.theme.borderRadius} 0 0 ${p.theme.borderRadius}`};
  white-space: nowrap;
  max-width: 200px;
  &:hover,
  &:active {
    border-right: 0;
  }
  ${p =>
    !p.isOpen &&
    p.hasDarkBorderBottomColor &&
    css`
      border-bottom-color: ${p.theme.button.primary.border};
    `}
`;

const Wrapper = styled('div')`
  position: relative;
  display: flex;
`;
