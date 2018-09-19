import * as soap from 'soap';
import _ from 'lodash';
import { pd } from 'pretty-data';

import { IOAuthRefreshedCredential, IAuthService } from './AuthService';
import { ISelector } from '../../models/adwords';

interface ISoapServiceOpts {
  authService: IAuthService;
  url: string;
  serviceName: string;
  xmlns: string;
  header: any;
  verbose: boolean;
}

interface IGetInput {
  selector?: ISelector;
  serviceSelector?: ISelector;
}

class SoapService {
  private url: string;
  private authService: IAuthService;
  private client: soap.Client | undefined;
  private header: any;
  private verbose: boolean = false;
  private serviceName: string;
  private namespace: string = 'ns1';
  private description: any;
  private xmlns: string;
  constructor(options: ISoapServiceOpts) {
    this.authService = options.authService;
    this.url = options.url;
    this.serviceName = options.serviceName;
    this.xmlns = options.xmlns;
    this.header = options.header;
    this.verbose = options.verbose;
  }

  public setVerbose(val: boolean) {
    this.verbose = val;
  }

  /**
   * get operation
   *
   * @author dulin
   * @template T
   * @param {T} serviceSelector
   * @returns
   * @memberof SoapService
   */
  public async get<T>(serviceSelector: T) {
    const credentials: IOAuthRefreshedCredential = await this.authService.refreshCredentials();
    await this.createSoapClient(this.url, credentials);

    return new Promise((resolve, reject) => {
      if (!this.client) {
        return reject(new Error('soap client does not exist'));
      }
      const parameter = this.formGetParameter<T>(serviceSelector);
      this.client.get(parameter, (error: Error, result: any) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  }

  /**
   * form get parameter
   * https://github.com/mrdulin/nodejs-google-adwords/issues/2
   *
   * @author dulin
   * @private
   * @template T
   * @param {T} serviceSelector
   * @returns
   * @memberof SoapService
   */
  private formGetParameter<T>(serviceSelector: T) {
    const getInput: IGetInput = _.get(
      this.description,
      [this.serviceName, `${this.serviceName}InterfacePort`, 'get', 'input'],
      {}
    );
    let parameter = {};
    if (getInput.selector) {
      parameter = { selector: serviceSelector };
    } else if (getInput.serviceSelector) {
      parameter = { serviceSelector };
    }
    return parameter;
  }

  /**
   * create soap client
   *
   * @author dulin
   * @private
   * @param {string} url
   * @param {IOAuthRefreshedCredential} credentials
   * @returns {Promise<void>}
   * @memberof SoapService
   */
  private async createSoapClient(url: string, credentials: IOAuthRefreshedCredential): Promise<void> {
    try {
      this.client = await soap.createClientAsync(url, {});
      this.client.addSoapHeader(this.header, this.serviceName, this.namespace, this.xmlns);
      if (!credentials.access_token) {
        throw new Error('access_token required.');
      }
      this.client.setSecurity(new soap.BearerSecurity(credentials.access_token));
      this.description = this.client.describe();
      this.listenSoapClientEvents();
    } catch (error) {
      console.error(error);
      throw new Error('create soap client failed.');
    }
  }

  /**
   * handle soap client events
   *
   * @author dulin
   * @private
   * @memberof SoapService
   */
  private listenSoapClientEvents(): void {
    if (this.client) {
      this.client.on('request', (xml: string, eid: string) => {
        if (this.verbose) {
          console.log('Soap request (Envelope) including headers: ', pd.xml(xml));
          console.log('Soap request exchange id: ', eid);
        }
      });
      this.client.on('message', (xml: string, eid: string) => {
        if (this.verbose) {
          console.log('Soap body contents: ', pd.xml(xml));
        }
      });
      this.client.on('soapError', (error: any, eid: string) => {
        if (this.verbose) {
          console.error(error);
        }
      });
      this.client.on('response', (body: any, response: any, eid: string) => {
        if (this.verbose) {
          console.log('Soap response body: ', pd.xml(body));
          console.log('Soap response: ', pd.json(response));
          console.log('Soap response eid: ', eid);
        }
      });
    }
  }
}

export { SoapService, ISoapServiceOpts };
