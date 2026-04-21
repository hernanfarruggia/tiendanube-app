import { tiendanubeAuthClient, tiendanubeApiClient } from "@config";
import { BadRequestException } from "@utils";
import { userRepository } from "@repository";
import { TiendanubeAuthRequest, TiendanubeAuthInterface } from "@features/auth";
import WebhookRegistrationService from "@features/webhooks/webhook-registration.service";

interface InstallResponse extends TiendanubeAuthInterface {
  store_domain?: string;
}

class InstallAppService {
  public async install(code: string): Promise<InstallResponse> {
    if (!code) {
      throw new BadRequestException("The authorization code not found");
    }

    const body: TiendanubeAuthRequest = {
      client_id: process.env.CLIENT_ID as string,
      client_secret: process.env.CLIENT_SECRET as string,
      grant_type: "authorization_code",
      code: code,
    };

    const authenticateResponse = await this.authenticateApp(body);

    console.log('auth response ->', authenticateResponse)

    // This condition will be true when the code has been used or is invalid.
    if (authenticateResponse.error && authenticateResponse.error_description) {
      throw new BadRequestException(
        authenticateResponse.error as string,
        authenticateResponse.error_description
      );
    }

    // Validate user_id exists before proceeding
    if (!authenticateResponse.user_id) {
      throw new BadRequestException(
        "Invalid authentication response",
        "user_id is missing from authentication response"
      );
    }

    // Insert response of Authentication API at db.json file
    await userRepository.save(authenticateResponse);

    // Register webhooks for the newly installed app
    // await WebhookRegistrationService.registerWebhooks(authenticateResponse.user_id);

    // Get store information to obtain the original_domain
    const storeInfo = await this.getStoreInfo(authenticateResponse.user_id);
    const storeDomain = storeInfo?.original_domain;

    return {
      ...authenticateResponse,
      store_domain: storeDomain,
    };
  }

  private async authenticateApp(
    body: TiendanubeAuthRequest
  ): Promise<TiendanubeAuthInterface> {
    return tiendanubeAuthClient.post("/", body);
  }

  private async getStoreInfo(userId: number): Promise<any> {
    try {
      return await tiendanubeApiClient.get(`${userId}/store`);
    } catch (error) {
      console.error("Error fetching store info:", error);
      return null;
    }
  }
}

export default new InstallAppService();
