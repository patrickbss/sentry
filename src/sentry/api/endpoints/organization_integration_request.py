from __future__ import absolute_import

from rest_framework.response import Response

from sentry.api.bases.organization import OrganizationEndpoint
from sentry.api.permissions import SentryPermission
from sentry.constants import ObjectStatus
from sentry.models import Integration, OrganizationMember
from sentry.utils.email import MessageBuilder


class OrganizationIntegrationRequestPermission(SentryPermission):
    scope_map = {
        "POST": ["org:read"],
    }


# TODO How do I know if the plugin or sentry app is already installed?
def get_provider_name(organization, provider_type, provider_slug):
    """
    The things that users think of as "integrations" are actually three
    different things: integrations, plugins, and sentryapps. A user requesting
    than an integration be installed only actually knows the "provider" they
    want and not what type they want. This function TODO

    :param organization:
    :param provider_type:
    :param provider_slug:
    :return:
    """
    if provider_type == "sentryapp":
        # Check sentry app installations to make sure it isn't already installed.
        pass

    elif provider_type == "integration":
        integration = Integration.objects.get(id=integration_id)
        if not integration:
            raise Exception("Invalid provider_slug")

        return integration.name

    elif provider_type == "plugin":
        return ""

    else:
        raise Exception("Invalid provider_type")


class OrganizationIntegrationRequestEndpoint(OrganizationEndpoint):
    permission_classes = (OrganizationIntegrationRequestPermission,)

    def post(self, request, organization):
        """
        Email the organization owners asking them to install an integration.
        ````````````````````````````````````````````````````````````````````
        When a non-owner user views integrations in the integrations directory,
        they lack the ability to install them themselves. POSTing to this API
        alerts users with permission that there is demand for this integration.

        :param string provider_slug: Unique string that identifies the integration.
        :param string provider_type: One of: integration, plugin, sentryapp.
        :param string message: Optional message from the requester to the owners.
        """
        provider_type = request.data.get("provider_type")
        provider_slug = request.data.get("provider_slug")
        message_option = request.data.get("message", "").strip()

        # TODO throw errors if parameters are invalid.
        try:
            provider_name = get_provider_name(organization, provider_type, provider_slug)
        except Exception as error:
            return Response({"detail": error.message}, status=400)

        # If for some reason the user had permissions all along, silently fail.
        requester = request.user
        if requester.id in [user.id for user in organization.get_owners()]:
            return Response({"detail": "User can install integration"}, status=200)

        # In the edge case where an admin adds the integration between the user
        # seeing and clicking the button, just silently fail.
        installed_integration = self.get_organization_integration(organization, integration.id)
        if installed_integration and installed_integration.status == ObjectStatus.ACTIVE:
            return Response({"detail": "Integration already installed"}, status=200)

        # TODO 2.0 figure out url
        url = ""

        context = {
            "email": requester.email,
            "requester_name": requester.name,
            "organization_name": organization.slug,
            "integration_name": provider_name,
            "integration_slug": provider_slug,
            "integration_type": provider_type,
            "url": url,
        }

        # Sanitize the user input before sending it in an email.
        if message_option:
            # TODO 2.1 sanitize the message here
            context.update({"message": message_option})

        msg = MessageBuilder(
            subject="Sentry Integration Request from %s" % requester.name,
            template="sentry/emails/requests/organization-integration.txt",
            html_template="sentry/emails/requests/organization-integration.html",
            type="organization.integration.request",
            context=context,
        )

        # TODO 1.2 Should we check email preferences/unsubscribes?
        msg.send_async([user.email for user in organization.get_owners()])

        return Response(status=201)
