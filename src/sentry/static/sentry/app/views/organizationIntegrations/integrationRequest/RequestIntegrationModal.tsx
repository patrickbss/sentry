import React from 'react';

import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';
import {ModalRenderProps} from 'app/actionCreators/modal';
import Button from 'app/components/button';
import {t, tct} from 'app/locale';
import {Organization} from 'app/types';
import Form from 'app/views/settings/components/forms/form';
import InputField from 'app/views/settings/components/forms/inputField';
import JsonForm from 'app/views/settings/components/forms/jsonForm';
import FormModel from 'app/views/settings/components/forms/model';
import TextBlock from 'app/views/settings/components/text/textBlock';

// TODO solve this for one field.
class PublishRequestFormModel extends FormModel {
  getTransformedData() {
    const data = this.getData();
    // map object to list of questions
    const questionnaire = Array.from(this.fieldDescriptor.values()).map(field =>
      // we read the meta for the question that has a react node for the label
      ({
        question: field.meta || field.label,
        answer: data[field.name],
      })
    );
    return {questionnaire};
  }
}

// TODO expand
type Props = {
  organization: Organization;
} & ModalRenderProps;
type State = {
  isSending: boolean;
  message: string;
};

/**
 * This modal serves as a non-owner's confirmation step before sending
 * organization owners an email requesting a new organization integration. It
 * lets the user attach an optional message to be included in the email.
 */
export default class RequestIntegrationModal extends React.Component<Props, State> {
  form = new PublishRequestFormModel();

  constructor(props: Props, context) {
    super(props, context);

    this.state = {
      isSending: false,
      message: '',
      ...this.getDefaultState(),
    };
  }

  handleSubmitSuccess = () => {
    // TODO
    addSuccessMessage(t('%s successfully saved.', data.name));
    this.setState({isSent: true});
    this.props.closeModal();
  };

  handleSubmitError = () => {
    addErrorMessage('Error sending the request');
  };

  render() {
    const {
      closeModal,
      Header,
      Body,
      Footer,
      //
      organization,
    } = this.props;

    const endpoint = `organizations/${organization.slug}/request-integration`;
    const forms = [
      {
        title: t('Questions to answer'),
        fields: this.formFields,
      },
    ];

    const buttonText = this.state.isSending ? t('Sending Request') : t('Send Request');

    return (
      <React.Fragment>
        <Header>
          <h4>{t('TODO 3.3 Request Installation')}</h4>
        </Header>
        <Body>
          <TextBlock>
            {/* TODO read this from a file? */}
            {t(
              "TODO 3.4 I'm baby woke pork belly sustainable post-ironic vinyl la croix chia stumptown bespoke echo park literally affogato taxidermy health goth keytar. Pickled tilde franzen PBR&B, typewriter portland meditation mixtape copper mug affogato. Franzen bicycle rights you probably haven't heard of them adaptogen butcher cardigan. Vexillologist enamel pin fingerstache, narwhal kickstarter celiac palo santo poke skateboard chartreuse tumblr cronut venmo squid. Kickstarter keffiyeh distillery, meggings heirloom pop-up occupy echo park fam quinoa bicycle rights literally semiotics. Small batch stumptown raw denim snackwave iPhone enamel pin la croix kale chips craft beer keytar hashtag farm-to-table ugh humblebrag."
            )}
          </TextBlock>
          <TextBlock>
            {tct('An email will be sent to [email] with your request.', {
              email: 'TODO EMAIL',
            })}
          </TextBlock>
          <InputField
            inline={false}
            flexibleControlStateSize
            stacked
            label="TODO LABEL"
            name="message"
            type="string"
            onChange={value => this.setState({message: value})}
            placeholder={t('TODO 3.5 Optional message')}
          />
          <Form
            allowUndo
            apiMethod="POST"
            apiEndpoint={endpoint}
            onSubmitSuccess={this.handleSubmitSuccess}
            onSubmitError={this.handleSubmitError}
            model={this.form}
            submitLabel={buttonText}
            onCancel={closeModal}
          >
            <JsonForm forms={forms} />
          </Form>
        </Body>
        <Footer>
          <Button onClick={() => console.log('todo')}>{buttonText}</Button>
        </Footer>
      </React.Fragment>
    );
  }
}
