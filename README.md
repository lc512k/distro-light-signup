# distro-light-signup

Service to display a [light signup form](https://github.com/Financial-Times/o-email-only-signup) and [handle email subscription](https://github.com/Financial-Times/newsletter-signup). For use in distributed content channels where an iframe is more appropriate than the plain Origami component.

## Running locally

Clone, `npm install`, `npm run heroku-config` if you have `operate` access to the staging app on Heroku, `npm start`, `open http://localhost:1337`.

## Environment vars

See the [Environment vars section](https://github.com/Financial-Times/newsletter-signup#environment-vars) in newsletter-signup.

## Deployment

Master branch automatically deploys to [staging](https://distro-light-signup-staging.ft.com/). We promote staging builds to production when we feel like it.

### Note

When promoting to production, ***don't*** use the button on the Heroku dashboard. You can't (yet) run scripts on promote, and we need to deploy our VCL to Fastly. Instead, run `make promote`, which deploys the VCL and promotes to production. This requires the Heroku Toolbelt installed and `deploy` permissions on prod and staging.

## Who

[Matt B](https://github.com/quarterto) and [George C](https://github.com/georgecrawford) from the Apps team. Say hi in the #apps-distro-content or #apps-distro-devs Slack channels.

## Copyright
2016 Financial Times. All rights reserved
