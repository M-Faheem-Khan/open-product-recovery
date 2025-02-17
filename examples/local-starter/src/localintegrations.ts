/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  asyncIterableToArray,
  FakeOfferProducer,
  IntegrationApi,
  OfferChange,
  PluggableFactory,
  TenantNodeIntegrationInstaller,
} from 'opr-core';

// The general pattern for building your own custom integration for your server.
// First, export a map of keys to PluggableFactories. By convention, we name
// this "integrations".
export const LocalIntegrations = {
  LocalMain: {
    // Integrations have a "construct" method that tells the module loader how
    // to build the object you're providing. In this case, we're constructing
    // a HostIntegrationInstallFn, the most common way of installing an
    // integration. However, if you need to build a custom listing policy, or
    // some other custom object, you would create a "construct" method that
    // returns whatever kind of custom object you need.
    async construct() {
      return {
        type: 'integrationInstaller',

        async install(api: IntegrationApi): Promise<void> {
          api.installCustomHandler('ingest', {
            method: ['GET', 'POST'],
            handle: async () => {
              const changes = [] as Array<OfferChange>;
              const changeHandler = api.registerChangeHandler(async change => {
                changes.push(change);
              });
              await api.ingestOffers();
              changeHandler.remove();
              return changes;
            },
          });

          // Create a custom debug endpoint that will return the list of offers
          // made by this server.
          // ADD AUTHENTICATION TO AN ENDPOINT LIKE THIS! This is exposing
          // offers on your server to anyone that calls this endpoint. For a
          // real server, only admins and developers should be able to see this
          // information. Organizations should only see offers that are listed
          // for them.
          api.installCustomHandler('myOffers', {
            method: ['GET', 'POST'],
            handle: async () => {
              return await asyncIterableToArray(api.getOffersFromThisHost());
            },
          });

          // Create a custom debug endpoint that will return the list of offers
          // this host can accept
          // ADD AUTHENTICATION TO AN ENDPOINT LIKE THIS! This is exposing
          // offers on your server to anyone that calls this endpoint. For a
          // real server, only admins and developers should be able to see this
          // information. Organizations should only see offers that are listed
          // for them.
          api.installCustomHandler('theirOffers', {
            method: ['GET', 'POST'],
            handle: async () => {
              return await asyncIterableToArray(
                api.getListedOffers(api.hostOrgUrl)
              );
            },
          });

          // Here, we are only using one OfferProducer, the "FakeOfferProducer".
          // In this example, ingest() will call the FakeOfferProducer and
          // generate fake offers for testing/demo use.
          api.installOfferProducer(
            new FakeOfferProducer({
              sourceOrgUrl: api.hostOrgUrl,
              integrationApi: api,
            })
          );
        },
      };
    },
  } as PluggableFactory<TenantNodeIntegrationInstaller>,
  // You can create as many integrations as you'd like.
  helloworld: {
    async construct() {
      return {
        type: 'integrationInstaller',

        async install(api: IntegrationApi) {
          api.installCustomHandler('helloworld', {
            method: ['GET', 'POST'],
            handle: async () => {
              return 'Hello world. From ' + api.hostOrgUrl;
            },
          });
        },
      };
    },
  } as PluggableFactory<TenantNodeIntegrationInstaller>,
  howdyworld: {
    async construct() {
      return {
        type: 'integrationInstaller',

        async install(api: IntegrationApi) {
          api.installCustomHandler('howdyworld', {
            method: ['GET', 'POST'],
            handle: async () => {
              return 'Howdy world. From ' + api.hostOrgUrl;
            },
          });
        },
      };
    },
  } as PluggableFactory<TenantNodeIntegrationInstaller>,
};
