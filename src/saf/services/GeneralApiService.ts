import type { operations } from '../generated/general-api-v2';

export type EnrolTechUserRequest =
  operations['EnrolTechUser']['requestBody']['content']['application/json'];

export type EnrolTechUserResponse =
  operations['EnrolTechUser']['responses']['200']['content']['application/json'];

export type SafReceiversRequest =
  operations['SafReceivers']['requestBody']['content']['application/json'];

export type SafReceiversResponse =
  operations['SafReceivers']['responses']['200']['content']['application/json'];

export type SafInsurersRequest =
  operations['SafInsurers']['requestBody']['content']['application/json'];

export type SafInsurersResponse =
  operations['SafInsurers']['responses']['200']['content']['application/json'];

export class GeneralApiService {
  enrolTechUser(_request: EnrolTechUserRequest): Promise<EnrolTechUserResponse> {
    return Promise.reject(new Error('General API runtime requests are not implemented yet.'));
  }

  getSafReceivers(_request: SafReceiversRequest): Promise<SafReceiversResponse> {
    return Promise.reject(new Error('General API runtime requests are not implemented yet.'));
  }

  getSafInsurers(_request: SafInsurersRequest): Promise<SafInsurersResponse> {
    return Promise.reject(new Error('General API runtime requests are not implemented yet.'));
  }
}
